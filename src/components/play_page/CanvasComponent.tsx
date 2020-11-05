import React from 'react';
import Sketch from "react-p5";
import p5Types from "p5"; 

import LevelObject from '../../../server/Level_Object';
import CanvasVars from './CanvasVars';
import RoomObject from '../../../server/Room_Object';

type progressType = "preparing"|"playing"|"incomplete"|"complete";
type Pos = [number, number];

function P5_Canvas(
    levelObject: LevelObject, 
    cv: CanvasVars, 
    setCv: React.Dispatch<React.SetStateAction<CanvasVars>>,
    progress: progressType, 
    setProgress: React.Dispatch<React.SetStateAction<progressType>>
) {
    if (!cv) return null;
    
    // constants
    const STROKE_COLOR : number = 20;
    const BG_COLOR : number = 28;
    const SQRT_3 : number = Math.sqrt(3);
    const HALF_SQRT_3 : number = SQRT_3 / 2;
    const tileType : RoomObject["options"]["type"] = levelObject.base.tileType;
    const DEG_FACTOR : number = tileType === "square" ? 90 : 60; // square: 90, triangle & hexagon: 60
    const MAX_ROTATE_AMOUNT: number = tileType === "square" ? 4 : 6;

    // semi constants
    let semiConstantsLoaded: boolean = false;
    let CANVAS_SIZE: number,
        tileScale: number,
        HALF_SCALE: number,
        SCALED_SQRT: number;
    let offset: Pos; // [x, y]

    // local controls
    let alreadyPressing = false; // prevent multiple clicks in draw()
    let cvUpdated: boolean = false;
    let occupiedTiles: Pos[] = [];
    let ghostPiecePos: Pos | null = null; // if not null then can place
    let lastCalculatedPos: Pos = [99, 99];
    let allPiecesPlaced : boolean = false;

    // animations
    let coverOpacity: number = 255;
    const placedPieceAPs: number[] = []; // start animation by setting the num to 1
    const rotateIndices: number[] = []; // all rotate indices (int) for pieces
    for (let i=0; i < levelObject.pieces.length; i++) {
        placedPieceAPs.push(0);
        rotateIndices.push(Math.floor(Math.random() * MAX_ROTATE_AMOUNT));
    }

    interface SelectedPiece {
        cursorPos: Pos,
        isRotatingLeft: boolean, // rotating forward
        rotateProgress: number, // if is 0 then done
        animateProgress: number // start animation by setting this to 1
    }
    const selectedPiece: SelectedPiece = {
        cursorPos: [0, 0],
        isRotatingLeft: true,
        rotateProgress: 0,
        animateProgress: 1 // starting animation
    };

    function renderTile(p: p5Types, pos: Pos, isUpward: boolean): void {
        const renderPos = calculateRenderPos(pos, isUpward);
        const x = renderPos[0];
        const y = renderPos[1];
        
        if (tileType === "square") {
          p.rect(x, y, tileScale, tileScale);
        } 
        else if (tileType === "hexagon") {
            p.beginShape();
            p.vertex(x + tileScale, y);
            p.vertex(x + HALF_SCALE, y + SCALED_SQRT);
            p.vertex(x - HALF_SCALE, y + SCALED_SQRT);
            p.vertex(x - tileScale, y);
            p.vertex(x - HALF_SCALE, y - SCALED_SQRT);
            p.vertex(x + HALF_SCALE, y - SCALED_SQRT);
            p.endShape(p.CLOSE);
        } 
        else if (tileType === "triangle") {
          const CENTER_Y = tileScale / (SQRT_3 * 2);
          if (isUpward) {
            p.triangle(
                x,
                y - (SCALED_SQRT - CENTER_Y),
                x - HALF_SCALE,
                y + CENTER_Y,
                x + HALF_SCALE,
                y + CENTER_Y
            );
          } else {
            p.triangle(
                x,
                y + (SCALED_SQRT - CENTER_Y),
                x - HALF_SCALE,
                y - CENTER_Y,
                x + HALF_SCALE,
                y - CENTER_Y
            );
          }
        }
    }

    function renderGhostPiece(p: p5Types, SPPosData: Pos[]): void {
        // --- ghost piece (update and render)
        let hoverPos: Pos | null = getHoveredTile();
        if (hoverPos !== null){ // pos is on base?
            const boolA: boolean = 
                hoverPos[0] === lastCalculatedPos[0] && 
                hoverPos[1] === lastCalculatedPos[1];
            const boolB: boolean = 
                ghostPiecePos !== null && 
                hoverPos[0] === ghostPiecePos[0] && 
                hoverPos[1] === ghostPiecePos[1];
            // not the same as ghostPiecePos or lastCalculatedPos? 
            if (!(boolA && boolB)){
                lastCalculatedPos = hoverPos;
                // check fitting pos (all tiles are in base but not in occupiedTiles)
                const isFittingPos: boolean = SPPosData.every(tilePos => {
                    const translatedPos: Pos = [
                        tilePos[0] + lastCalculatedPos[0],
                        tilePos[1] + lastCalculatedPos[1]
                    ];
                    return arrayHasTile(levelObject.base.posData, translatedPos) &&
                        !arrayHasTile(occupiedTiles, translatedPos);
                });
                if (isFittingPos){
                    ghostPiecePos = hoverPos;
                }
            }
        }
        // render
        if (ghostPiecePos !== null){
            let ghostColor = p.color(100);
            p.fill(ghostColor);
            p.stroke(ghostColor);
            p.strokeWeight(tileScale * 0.03);
            // render all tiles in selected piece in current rotate index
            SPPosData.forEach(tilePos => {
                if (ghostPiecePos === null) return; // to satisfy complier
                const translatedPos: Pos = [
                    tilePos[0] + ghostPiecePos[0],
                    tilePos[1] + ghostPiecePos[1]
                ];
                renderTile(p, translatedPos, getTDir(translatedPos, true));
            });
        }
    }

    function loadData(p: p5Types): void{
        const CS = CANVAS_SIZE;
        p.background(BG_COLOR);
        
        // BASE
        p.fill(60); // BASE COLOR
        p.stroke(60); // BASE OUTLINES COLOR
        p.strokeWeight(tileScale * 0.03);
        levelObject.base.posData.forEach((pos) => {
          renderTile(p, pos, getTDir(pos, true))
        });
        cv.imagesContainer.baseImg = p.get(0, 0, CS, CS);
        
        // PIECES
        cv.imagesContainer.pieceImages = [];
        levelObject.pieces.forEach((pieceGroup, pieceIndex) => {
          p.fill(pieceGroup.color);
          p.stroke(STROKE_COLOR);
          p.strokeWeight(tileScale * getStrokeWeight());
          
          p.clear();
          // render tiles (original rotation) in this piece group
          pieceGroup.posDataArray[0].forEach((pos) => {
            const originalPos: Pos = [
              pos[0] + pieceGroup.rootPosOnBase[0],
              pos[1] + pieceGroup.rootPosOnBase[1]
            ];
            
            renderTile(
                p,
                originalPos,
                getTDir(originalPos, true)
            );
          })
          
          const renderPos = calculateRenderPos(
            pieceGroup.rootPosOnBase,
            getTDir(pieceGroup.rootPosOnBase, true)
          );
          // save image
          cv.imagesContainer.pieceImages.push(p.get(
            renderPos[0] - CS,
            renderPos[1] - CS,
            CS * 2,
            CS * 2
          ));
          // render and save ghost image
        });
      
        cvUpdated = true;
        p.background(BG_COLOR);
    }


    function scrollSelectedPiece(toLeft: boolean, isPlacing?: boolean): void {
        // if is placing the last piece
        if (isPlacing && cv.placedPieces.length + 1 === rotateIndices.length){
            allPiecesPlaced = true;
            return;
        }
        
        // make a list of available indices to select
        const availableIndices: number[] = [];
        for (let i=0; i < rotateIndices.length; i++){
            // add index if not in placedPieces
            if (!cv.placedPieces.some((pp) => pp.index === i)){
                availableIndices.push(i);
            }
        }

        let changingIndex: number = availableIndices.indexOf(cv.selectedPiece.index);
        if (changingIndex === -1) return; // quit
        changingIndex += toLeft ? -1 : 1;
        if (changingIndex < 0) changingIndex = availableIndices.length - 1;
        else if (changingIndex >= availableIndices.length) changingIndex = 0;

        // set new index, and apply opacity
        cv.selectedPiece.index = availableIndices[changingIndex];
        cvUpdated = true;
        selectedPiece.animateProgress = 1;
        selectedPiece.rotateProgress = 0; // cancel rotating animation
        clearGhost();
    }
    function rotateSelectedPiece(toLeft: boolean): void{
        // check to jump to 0 or to max
        let newRotateIndex: number = rotateIndices[cv.selectedPiece.index] + (toLeft ? -1 : 1);
        if (newRotateIndex < 0) newRotateIndex = MAX_ROTATE_AMOUNT - 1;
        else if (newRotateIndex >= MAX_ROTATE_AMOUNT) newRotateIndex = 0;
        rotateIndices[cv.selectedPiece.index] = newRotateIndex; // set it

        // initiate rotate animation
        selectedPiece.isRotatingLeft = toLeft;
        selectedPiece.rotateProgress = 1;
        clearGhost();
    }
    function placeSelectedPiece(SPPosData: Pos[]): void{
        if (ghostPiecePos !== null){
            // add the tiles to occupiedTiles
            SPPosData.forEach(tilePos => {
                const translatedPos: Pos = [
                    tilePos[0] + lastCalculatedPos[0],
                    tilePos[1] + lastCalculatedPos[1]
                ];
                occupiedTiles.push(translatedPos);
            });

            // get the vars before scrolling to new piece
            const thePlacingPieceIndex: number = cv.selectedPiece.index;
            const placedPos: Pos = [ghostPiecePos[0], ghostPiecePos[1]];
            scrollSelectedPiece(true, true); // scroll (will clear ghostPiecePos and lastCalculatedPos)
            // add to placed piece
            cv.placedPieces.push({
                index: thePlacingPieceIndex,
                placedPos: placedPos,
                rotateIndex: rotateIndices[thePlacingPieceIndex]
            });
            cvUpdated = true;
            placedPieceAPs[thePlacingPieceIndex] = 1; // initiate animation
        }
    }

    function calculateAndSetSemiConstants(p: p5Types): void{
        const SMALLEST_SIZE = p.min(document.documentElement.clientWidth, document.documentElement.clientHeight);
        CANVAS_SIZE = p.min(SMALLEST_SIZE - 20, 500);
        tileScale = levelObject.base.tileFactor * CANVAS_SIZE;
        offset = [
            levelObject.base.offsetFactors[0] * CANVAS_SIZE,
            levelObject.base.offsetFactors[1] * CANVAS_SIZE,
        ];
        HALF_SCALE = tileScale / 2;
        SCALED_SQRT = HALF_SQRT_3 * tileScale;

        p.resizeCanvas(CANVAS_SIZE, CANVAS_SIZE);
        selectedPiece.cursorPos = [CANVAS_SIZE/2, CANVAS_SIZE/2]; // center cursor
        semiConstantsLoaded = true;
    }
    const windowResized = (p: p5Types) => {calculateAndSetSemiConstants(p)};
    const setup = (p: p5Types, canvasParentRef: Element) => {
        p.createCanvas(100, 100).parent(canvasParentRef); // default size
        p.angleMode(p.DEGREES);
        p.imageMode(p.CENTER);
        p.rectMode(p.CENTER);
        p.frameRate(60);

        calculateAndSetSemiConstants(p);
    };

    const draw = (p: p5Types) => {
        // must have semi constants ready
        if (!semiConstantsLoaded) calculateAndSetSemiConstants(p);

        // all images loaded ?
        if (cv.imagesContainer.baseImg){
            const SPIndex: number = cv.selectedPiece.index;
            const SPPosData: Pos[] = levelObject.pieces[SPIndex].posDataArray[rotateIndices[SPIndex]];

            // RENDERS FOR ALL STATES EXCEPT preparing
            if (progress !== "preparing"){
                // --- base image
                p.image(
                    cv.imagesContainer.baseImg, 
                    p.width/2, p.height/2,
                    p.width,
                    p.height
                );

                renderGhostPiece(p, SPPosData); // ghost piece layer before placed pieces

                // --- placed pieces
                cv.placedPieces.forEach((placedPiece) => {
                    const pIndex: number = placedPiece.index;
                    const rootPos = placedPiece.placedPos;
                    const renderPos = calculateRenderPos(
                        rootPos,
                        getTDir(rootPos, true)
                    );

                    // apply & update animate progress (if playing state)
                    let ap: number = placedPieceAPs[pIndex];
                    if (ap > 0 && progress === "playing"){
                        ap -= 0.06; // animate speed
                        if (ap < 0) ap = 0; // constrain
                        placedPieceAPs[pIndex] = ap;
                    }
                    p.push();
                    p.translate(renderPos[0], renderPos[1] - ap * CANVAS_SIZE * 0.2); // move factor
                    p.rotate(getDeg(placedPiece.rotateIndex) + ap * -30); // rotate factor
                    p.image(
                        cv.imagesContainer.pieceImages[pIndex],
                        0, 0,
                        p.width*2, 
                        p.height*2
                    );
                    p.pop();
                });
            } // end: RENDERS FOR ALL STATES EXCEPT preparing

            // RENDERS FOR PLAYING STATE (and not all pieces are placed yet)
            if (progress === "playing" && !allPiecesPlaced){
                // --- selected piece
                p.push();
                p.translate(selectedPiece.cursorPos[0], selectedPiece.cursorPos[1]);

                // update rotate progress
                let rotateRenderIndex: number = rotateIndices[cv.selectedPiece.index];
                rotateRenderIndex += (selectedPiece.isRotatingLeft ? 1 : -1) * selectedPiece.rotateProgress;
                if (selectedPiece.rotateProgress > 0){
                    selectedPiece.rotateProgress -= 0.1;
                    if (selectedPiece.rotateProgress < 0) selectedPiece.rotateProgress = 0;
                }
                p.rotate(getDeg(rotateRenderIndex));

                // apply & update animate progress
                let ap: number = selectedPiece.animateProgress;
                if (ap > 0){
                    ap -= 0.1; // scale offset speed
                    if (ap < 0) ap = 0; // constrain
                    selectedPiece.animateProgress = ap;
                    p.scale(1 - ap * 0.3); // scale offset factor
                }
                p.image(
                    cv.imagesContainer.pieceImages[SPIndex],
                    0, 0, p.width*2, p.height*2
                );
                p.pop();


                
                
                // update cursor and check click (if mouse is within canvas)
                if (p.mouseX > 0 && p.mouseX < p.width &&
                    p.mouseY > 0 && p.mouseY < p.height){
                    // update selected piece cursor pos
                    selectedPiece.cursorPos = [p.mouseX, p.mouseY];

                    // check click
                    if (p.mouseIsPressed && !alreadyPressing && p.touches.length === 0){
                        alreadyPressing = true;
                        // CLICK ACTION HERE
                            ////////////////////
                            placeSelectedPiece(SPPosData);
                            
                    }
                    else if (!p.mouseIsPressed && alreadyPressing){
                        alreadyPressing = false;
                    }
                }
                
            } // end: RENDERS FOR PLAYING STATE

        } else loadData(p); // images not loaded

        // render canvas cover for preparing state and playing state (fading if loaded)
        if (progress === "preparing") p.background(BG_COLOR);
        else if (coverOpacity > 0 && progress === "playing"){
            const c: p5Types.Color = p.color(BG_COLOR);
            c.setAlpha(coverOpacity);
            p.fill(c);
            p.rect(p.width/2, p.height/2, p.width * 1.3, p.height * 1.3);

            // update canvas cover opacity
            if (cv.imagesContainer.baseImg) coverOpacity -= 25; // speed
        }
    
        // check win (if all pieces placed and placed piece animations are all done)
        if (allPiecesPlaced && placedPieceAPs.every((ap) => ap === 0)){
            setProgress("complete");
        }

        // update cv
        if (cvUpdated) {
            console.log("CV updated");
            setCv(cv);
            cvUpdated = false;
        }
    };
    const keyPressed = (p: p5Types) => {
        // a: 65  s: 83  z: 90  x: 88
        if (p.keyCode === 65){ // A
            scrollSelectedPiece(true);
        } else if (p.keyCode === 83){ // S
            scrollSelectedPiece(false);
        } else if (p.keyCode === 90){ // Z
            rotateSelectedPiece(false);
        } else if (p.keyCode === 88){ // X
            rotateSelectedPiece(true);
        } else { // FOR TESTING
            console.log("cv", cv);
        }
    };

    // helper functions
    function clearGhost(): void {
        ghostPiecePos = null;
        lastCalculatedPos = [99, 99];
    }
    // returns true if the given array has the given position
    function arrayHasTile(arr: Pos[], tilePos: Pos): boolean{
        return arr.some(pos => pos[0] === tilePos[0] && pos[1] === tilePos[1]);
    }
    function getDeg(rotateIndex: number): number{
        return -DEG_FACTOR * rotateIndex;
    }
    // return true if this triangle tile is upward
    function getTDir(pos: Pos, rootIsUpward: boolean): boolean{
        if (rootIsUpward) return (pos[0] + pos[1]) % 2 === 0;
        return Math.abs((pos[0] + pos[1]) % 2) === 1;
    }
    function getStrokeWeight(): number{
        switch(tileType){
          case "square":
            return 0.08;
          case "hexagon":
            return 0.11;
          case "triangle":
            return 0.05;
        }
    }
    // takes in grid pos and returns render pos
    function calculateRenderPos(pos: Pos, isUpward: boolean): Pos{
        let x: number = 0, y: number = 0;
        if (tileType === "square") {
            x = offset[0] + pos[0] * tileScale;
            y = offset[1] + pos[1] * tileScale;
        }
        else if (tileType === "hexagon") {
            x = offset[0] + pos[0] * tileScale * 3 / 2;
            y = offset[1] + (pos[1] * 2 + pos[0]) * SCALED_SQRT;
        }
        else if (tileType === "triangle") {
            const CENTER_Y: number = tileScale / (SQRT_3 * 2);
            const yOffset: number = isUpward ? SCALED_SQRT - (CENTER_Y * 2) : 0;
            x = offset[0] + pos[0] * HALF_SCALE;
            y = offset[1] + pos[1] * SCALED_SQRT + yOffset;
        }
        return [x, y];
    }
    // returns null if not a vaild tile
    function getHoveredTile(): Pos | null{
        let r: Math["round"] = Math.round;
        let result: [number, number] = [0, 0];
        const cursorPos : Pos = selectedPiece.cursorPos;
        
        if (tileType === "square"){
            result = [
            r((cursorPos[0] - offset[0])/tileScale),
            r((cursorPos[1] - offset[1])/tileScale),
            ];
        } 
        else if (tileType === "hexagon"){    
            const xPos = (cursorPos[0] - offset[0])/tileScale/3*2;
            const yPos = ((cursorPos[1] - offset[1])/SCALED_SQRT - xPos) / 2;
            result = [r(xPos), r(yPos)];
        } 
        else if (tileType === "triangle"){
            const rootIsUpward: boolean = levelObject.pieces[cv.selectedPiece.index].rootIsUpward;
            const SPRotateIndex: number = rotateIndices[cv.selectedPiece.index];
            let lookingForUpward = rootIsUpward === (SPRotateIndex % 2 === 0);

            const CENTER_Y = tileScale / (SQRT_3 * 2);
            const yOffset = lookingForUpward ? SCALED_SQRT - (CENTER_Y * 2) : 0;
            const xPos = (cursorPos[0] - offset[0]) / HALF_SCALE;
            const yPos = (cursorPos[1] - offset[1] - yOffset) / SCALED_SQRT;
            
            // if is the other direction
            if (getTDir([r(xPos), r(yPos)], true) !== lookingForUpward){
            // more to the right?
            if (Math.ceil(xPos) - r(xPos) > 0.5){
                result = [r(xPos + 1), r(yPos)];
            }
            else result = [r(xPos - 1), r(yPos)];
            }
            else result = [r(xPos), r(yPos)];
        }
        
        if (arrayHasTile(levelObject.base.posData, result)) return result;
        return null; // return null if not a tile in baseTiles
    }
 
    return <Sketch setup={setup} draw={draw} keyPressed={keyPressed} windowResized={windowResized} />;
}

export default P5_Canvas;