import mongoose, { Schema, Document } from 'mongoose';

export interface IWatermarkSettings {
  type: 'TEXT' | 'LOGO' | 'NONE';
  text?: string;
  logoUrl?: string;
  position: 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT' | 'CENTER';
  opacity: number; // 0 to 1
}

export interface IUsageLimit {
  photosUploaded: number;
  videosUploaded: number;
  aiSearchesCount: number;
}

export interface IStudio extends Document {
  name: string;
  logoUrl?: string;
  subdomain: string; // unique subdomain, e.g. "dreamstudio"
  customDomain?: string; // e.g. "gallery.dreamstudio.com"
  ownerId: mongoose.Types.ObjectId;
  watermark: IWatermarkSettings;
  subscriptionPlan: 'STARTER' | 'PROFESSIONAL' | 'BUSINESS' | 'ENTERPRISE';
  subscriptionStatus: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'TRIALING' | 'FREE';
  razorpaySubscriptionId?: string;
  usage: IUsageLimit;
  createdAt: Date;
  updatedAt: Date;
}

const StudioSchema = new Schema<IStudio>({
  name: { type: String, required: true },
  logoUrl: { type: String },
  subdomain: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  customDomain: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  watermark: {
    type: { type: String, enum: ['TEXT', 'LOGO', 'NONE'], default: 'NONE' },
    text: { type: String, default: 'Mara Photo' },
    logoUrl: { type: String },
    position: { 
      type: String, 
      enum: ['TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_RIGHT', 'CENTER'], 
      default: 'BOTTOM_RIGHT' 
    },
    opacity: { type: Number, default: 0.5, min: 0, max: 1 }
  },
  subscriptionPlan: { 
    type: String, 
    enum: ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'], 
    default: 'STARTER' 
  },
  subscriptionStatus: { 
    type: String, 
    enum: ['ACTIVE', 'PAST_DUE', 'CANCELLED', 'TRIALING', 'FREE'], 
    default: 'FREE' 
  },
  razorpaySubscriptionId: { type: String },
  usage: {
    photosUploaded: { type: Number, default: 0 },
    videosUploaded: { type: Number, default: 0 },
    aiSearchesCount: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

export const Studio = mongoose.model<IStudio>('Studio', StudioSchema);
