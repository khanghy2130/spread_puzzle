// Level Object to send to clients when puzzle is created
import p5Types from "p5"; 

type Pos = [number, number];

export default interface CanvasVars {
    imagesContainer: {
        baseImg: p5Types.Image | null, // if this is null then no image is loaded yet
        pieceImages: p5Types.Image[]
    },

    placedPieces: ({
        index: number,
        placedPos: Pos,
        rotateIndex: number
    })[],

    selectedPiece: {
        index: number,
        isPlacing: boolean,
        // null is not rotating
        nextRotate: "left" | "right" | null
    }
}