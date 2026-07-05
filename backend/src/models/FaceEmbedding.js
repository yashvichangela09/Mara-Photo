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
exports.FaceEmbedding = void 0;
var mongoose_1 = __importStar(require("mongoose"));
var FaceEmbeddingSchema = new mongoose_1.Schema({
    mediaId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Media', required: true, index: true },
    eventId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    studioId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Studio', required: true },
    embedding: { type: [Number], required: true }, // We will index this in MongoDB Atlas Vector Search
    bbox: { type: [Number], required: true },
    faceThumbnailUrl: { type: String },
    timestamp: { type: Number } // Optional: used for identifying timestamp in videos
}, {
    timestamps: true
});
// If using MongoDB Atlas Vector Search, you would configure an index like:
// {
//   "fields": [
//     {
//       "type": "vector",
//       "path": "embedding",
//       "numDimensions": 512,
//       "similarity": "cosine"
//     }
//   ]
// }
exports.FaceEmbedding = mongoose_1.default.model('FaceEmbedding', FaceEmbeddingSchema);
