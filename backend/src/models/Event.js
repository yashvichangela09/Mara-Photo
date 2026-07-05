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
exports.Event = void 0;
var mongoose_1 = __importStar(require("mongoose"));
var EventSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    clientName: { type: String, required: true },
    clientMobile: { type: String, required: true },
    clientEmail: { type: String, required: true, lowercase: true, trim: true },
    date: { type: Date, required: true },
    type: {
        type: String,
        enum: ['WEDDING', 'PRE_WEDDING', 'RECEPTION', 'BIRTHDAY', 'CORPORATE', 'SCHOOL', 'GARBA', 'CONCERT', 'RELIGIOUS'],
        required: true
    },
    coverImageUrl: { type: String },
    description: { type: String },
    location: { type: String },
    accessType: {
        type: String,
        enum: ['PUBLIC', 'PASSWORD', 'OTP', 'QR'],
        default: 'PUBLIC'
    },
    passwordHash: { type: String },
    studioId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Studio', required: true },
    assignedTeamMembers: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
    watermark: {
        isActive: { type: Boolean, default: false },
        type: { type: String, enum: ['TEXT', 'LOGO'], default: 'LOGO' },
        text: { type: String },
        logoUrl: { type: String },
        position: {
            type: String,
            enum: ['TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_RIGHT', 'CENTER'],
            default: 'BOTTOM_RIGHT'
        },
        width: { type: Number, default: 20 },
        height: { type: Number, default: 20 },
        opacity: { type: Number, default: 0.5, min: 0, max: 1 }
    }
}, {
    timestamps: true
});
exports.Event = mongoose_1.default.model('Event', EventSchema);
