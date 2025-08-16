import mongoose, { Schema, Document } from 'mongoose';

export interface IPosition extends Document {
  portfolioId: mongoose.Types.ObjectId;
  symbol: string;
  quantity: number;
  averageEntryPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  costBasis: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PositionSchema: Schema = new Schema(
  {
    portfolioId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Portfolio', 
      required: true,
      index: true 
    },
    symbol: { 
      type: String, 
      required: true,
      index: true 
    },
    quantity: { 
      type: Number, 
      required: true 
    },
    averageEntryPrice: { 
      type: Number, 
      required: true 
    },
    currentPrice: { 
      type: Number, 
      required: true 
    },
    marketValue: { 
      type: Number, 
      required: true 
    },
    unrealizedPL: { 
      type: Number, 
      required: true 
    },
    unrealizedPLPercent: { 
      type: Number, 
      required: true 
    },
    costBasis: { 
      type: Number, 
      required: true 
    },
    lastUpdated: { 
      type: Date, 
      default: Date.now 
    }
  },
  { 
    timestamps: true,
    // Create a compound index for efficient queries
    indexes: [
      { fields: { portfolioId: 1, symbol: 1 }, options: { unique: true } }
    ]
  }
);

export const Position = mongoose.model<IPosition>('Position', PositionSchema);