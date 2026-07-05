"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Studio = void 0;
var mongoose_1 = __importStar(require("mongoose"));
var StudioSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    logoUrl: { type: String },
    subdomain: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    customDomain: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    ownerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
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
exports.Studio = mongoose_1.default.model('Studio', StudioSchema);
