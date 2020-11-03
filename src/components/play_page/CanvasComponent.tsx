import React from 'react';
import Sketch from "react-p5";
import p5Types from "p5"; 

import LevelObject from '../../../server/Level_Object';
import CanvasVars from './CanvasVars';
import RoomObject from '../../../server/Room_Object';

type progressType = "preparing"|"playing"|"incomplete"|"complete";
type Pos = [number, number];
type DirectionDegree = 0 | 30 | 90 | 150 | 180 | 210 | 270 | 330;

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
    ///// a few more from levelObject ...

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
    let lastCalculatedPos: Pos = [99, 99];
    let occupiedTiles: Pos[] = [];

    interface SelectedPiece {
        cursorPos: Pos,
        renderDeg: DirectionDegree,
        targetDeg: DirectionDegree,
        opacity: number // 0 - 255
    }
    const selectedPiece: SelectedPiece = {
        cursorPos: [0, 0],
        renderDeg: 0,
        targetDeg: 0,
        opacity: 0
    };

    // if is null instead then there is no ghost piece
    interface GhostPiece {
        pieceIndex: number,
        pos: Pos,
        rotateDeg: DirectionDegree
    }
    const ghostPiece: GhostPiece | null = null;

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
          
          // save image
          const renderPos = calculateRenderPos(
            pieceGroup.rootPosOnBase,
            getTDir(pieceGroup.rootPosOnBase, true)
          );
          cv.imagesContainer.pieceImages.push(p.get(
            renderPos[0] - CS,
            renderPos[1] - CS,
            CS * 2,
            CS * 2
          ));
        });
      
        cv.imagesContainer.loaded = true;
        cvUpdated = true;
        p.background(BG_COLOR);
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
    }
    const windowResized = (p: p5Types) => {calculateAndSetSemiConstants(p)};
    const setup = (p: p5Types, canvasParentRef: Element) => {
        p.createCanvas(100, 100).parent(canvasParentRef); // default size
        p.angleMode(p.DEGREES);
        p.imageMode(p.CENTER);
        p.rectMode(p.CENTER);
        p.frameRate(30);

        calculateAndSetSemiConstants(p);
    };

    const draw = (p: p5Types) => {
        // must have semi constants ready
        if (!semiConstantsLoaded) calculateAndSetSemiConstants(p);

        // all images loaded ?
        if (cv.imagesContainer.loaded){
            // RENDERS FOR ALL STATES
            // base image
            if (cv.imagesContainer.baseImg) p.image(
                cv.imagesContainer.baseImg, 
                p.width/2, p.height/2,
                p.width,
                p.height
            );
            // placed pieces
            ///////////////

            // RENDERS FOR PLAYING STATE
            if (progress === "playing"){
                // testing
                cv.imagesContainer.pieceImages.forEach((pieceImage, i) => {
                    p.push();
                    const rootPos = levelObject.pieces[i].rootPosOnBase;
                    const renderPos = calculateRenderPos(
                      rootPos,
                      getTDir(rootPos, true)
                    );
                    p.translate(renderPos[0], renderPos[1]);
                    //rotate(frameCount * 1.2);
                    p.image(
                      pieceImage,
                      0, 0,
                      p.width*2, 
                      p.height*2
                    );
                    p.pop();
                });

                // selected piece
                /////


                // ACTION: click by mouse, not touch
                if (p.mouseIsPressed && !alreadyPressing && p.touches.length === 0){
                    alreadyPressing = true;
                    /////
                }
                else if (!p.mouseIsPressed && alreadyPressing){
                    alreadyPressing = false;
                }
            }

        }
        else loadData(p);

        // render canvas cover
        if (cv.imagesContainer.coverOpacity > 0){
            const c: p5Types.Color = p.color(BG_COLOR);
            c.setAlpha(cv.imagesContainer.coverOpacity);
            p.fill(c);
            p.rect(p.width/2, p.height/2, p.width * 1.3, p.height * 1.3);

            // update canvas cover opacity
            if (cv.imagesContainer.loaded) {
                cv.imagesContainer.coverOpacity -= 25; // fade in speed
                cvUpdated = true;
            }
        }

        if (cvUpdated) setCv(cv); // update cv
    };

    // helper functions
    // returns true if the given array has the given position
    function arrayHasTile(arr: Pos[], tilePos: Pos): boolean{
        return arr.some(pos => pos[0] === tilePos[0] && pos[1] === tilePos[1]);
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
 
    return <Sketch setup={setup} draw={draw} windowResized={windowResized} />;
}

export default P5_Canvas;