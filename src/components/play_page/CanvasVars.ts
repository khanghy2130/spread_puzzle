// Level Object to send to clients when puzzle is created
import p5Types from "p5"; 

type Pos = [number, number];
type DirectionDegree = 0 | 30 | 90 | 150 | 180 | 210 | 270 | 330;

export default interface CanvasVars {
    imagesContainer: {
        loaded: boolean,
        coverOpacity: number, // opacity of rect that covers the canvas

        baseImg: p5Types.Image | null,
        baseSize: number,
        pieceImages: p5Types.Image[]
    },

    selectedPieceIndex: number,
    placedPieces: ({
        pieceIndex: number,
        placedPos: Pos,
        rotateDeg: DirectionDegree,
        glowValue: number
    })[],
    occupiedTiles: Pos[]
}