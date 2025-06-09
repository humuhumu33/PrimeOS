import { ChessPiece } from '../core/chess-core/types';

export const DEFAULT_PST: Record<ChessPiece, number[]> = {
  [ChessPiece.WhitePawn]: new Array(64).fill(0),
  [ChessPiece.WhiteKnight]: new Array(64).fill(0),
  [ChessPiece.WhiteBishop]: new Array(64).fill(0),
  [ChessPiece.WhiteRook]: new Array(64).fill(0),
  [ChessPiece.WhiteQueen]: new Array(64).fill(0),
  [ChessPiece.WhiteKing]: new Array(64).fill(0),
  [ChessPiece.BlackPawn]: new Array(64).fill(0),
  [ChessPiece.BlackKnight]: new Array(64).fill(0),
  [ChessPiece.BlackBishop]: new Array(64).fill(0),
  [ChessPiece.BlackRook]: new Array(64).fill(0),
  [ChessPiece.BlackQueen]: new Array(64).fill(0),
  [ChessPiece.BlackKing]: new Array(64).fill(0)
};
