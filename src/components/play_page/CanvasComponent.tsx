import React from 'react';
import Sketch from "react-p5";
import p5Types from "p5"; 

import LevelObject from '../../../server/Level_Object';
import CanvasVars from './CanvasVars';
import RoomObject from '../../../server/Room_Object';

type Pos = [number, number];
type DirectionDegree = 0 | 30 | 90 | 150 | 180 | 210 | 270 | 330;

function P5_Canvas(levelObject: LevelObject, cv: CanvasVars, setCv: React.Dispatch<React.SetStateAction<CanvasVars>>) {
    if (!cv) return null;
    
    // constants
    const STROKE_COLOR : number = 20;
    const BG_COLOR : number = 28;
    const SQRT_3 : number = Math.sqrt(3);
    const HALF_SQRT_3 : number = SQRT_3 / 2;
    const tileType : RoomObject["options"]["type"] = levelObject.base.tileType;
    ///// a few more from levelObject ...

    // semi constants
    let CANVAS_SIZE: number,
        tileScale: number,
        HALF_SCALE: number,
        SCALED_SQRT: number;
    let offset: number[]; // [x, y]

    // local controls
    let alreadyPressing = false; // prevent multiple clicks in draw()


    function calculateAndSetSemiConstants(p: p5Types): void{
        const SMALLEST_SIZE = p.min(document.documentElement.clientWidth, document.documentElement.clientHeight);
        CANVAS_SIZE = p.min(SMALLEST_SIZE, 500);
        tileScale = levelObject.base.tileFactor * CANVAS_SIZE;
        offset = levelObject.base.offsetFactors.map(f => f * CANVAS_SIZE);
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
        
        //loadData();
    };

    const draw = (p: p5Types) => {
        p.background(0);

        // click by mouse, not touch
        if (p.mouseIsPressed && !alreadyPressing && p.touches.length === 0){
            alreadyPressing = true;
            /////
        }
        else if (!p.mouseIsPressed && alreadyPressing){
            alreadyPressing = false;
        }

        setCv(cv); // update cv
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
 
    return <Sketch setup={setup} draw={draw} windowResized={windowResized} />;
}

export default P5_Canvas;