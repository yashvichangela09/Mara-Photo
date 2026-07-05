"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processMediaLocal = exports.processVideo = exports.processPhoto = exports.videoQueue = exports.photoQueue = exports.isRedisAvailable = void 0;
var bullmq_1 = require("bullmq");
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var os_1 = __importDefault(require("os"));
var net_1 = __importDefault(require("net"));
var axios_1 = __importDefault(require("axios"));
var sharp_1 = __importDefault(require("sharp"));
var fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
var dotenv_1 = __importDefault(require("dotenv"));
var redis_1 = require("../config/redis");
var StorageService_1 = require("../services/StorageService");
var models_1 = require("../models");
dotenv_1.default.config();
// ---- Redis availability check ----
exports.isRedisAvailable = false;
var checkRedis = function () {
    return new Promise(function (resolve) {
        var socket = net_1.default.createConnection({ host: redis_1.redisConfig.host, port: redis_1.redisConfig.port });
        socket.setTimeout(800);
        socket.on('connect', function () { socket.destroy(); resolve(true); });
        socket.on('timeout', function () { socket.destroy(); resolve(false); });
        socket.on('error', function () { socket.destroy(); resolve(false); });
    });
};
// Lazy queues & workers – only created when Redis is reachable
exports.photoQueue = null;
exports.videoQueue = null;
checkRedis().then(function (available) {
    exports.isRedisAvailable = available;
    if (available) {
        console.log('[MediaWorker] Redis is available – starting BullMQ queues & workers.');
        exports.photoQueue = new bullmq_1.Queue('photo-processing', { connection: redis_1.redisConfig });
        exports.videoQueue = new bullmq_1.Queue('video-processing', { connection: redis_1.redisConfig });
        initWorkers();
    }
    else {
        console.log('[MediaWorker] Redis is offline – BullMQ queues disabled. Uploads will process synchronously.');
    }
});
var AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
/**
 * Downloads a file from a URL as a Buffer (e.g. for Studio Logos)
 */
var downloadUrlToBuffer = function (url) { return __awaiter(void 0, void 0, void 0, function () {
    var res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, axios_1.default.get(url, { responseType: 'arraybuffer' })];
            case 1:
                res = _a.sent();
                return [2 /*return*/, Buffer.from(res.data)];
        }
    });
}); };
/**
 * Helper to calculate watermark placement
 */
var getWatermarkPosition = function (position, imgWidth, imgHeight, wWidth, wHeight) {
    var margin = 40;
    switch (position) {
        case 'TOP_LEFT':
            return { left: margin, top: margin };
        case 'TOP_RIGHT':
            return { left: imgWidth - wWidth - margin, top: margin };
        case 'BOTTOM_LEFT':
            return { left: margin, top: imgHeight - wHeight - margin };
        case 'CENTER':
            return { left: Math.round((imgWidth - wWidth) / 2), top: Math.round((imgHeight - wHeight) / 2) };
        case 'BOTTOM_RIGHT':
        default:
            return { left: imgWidth - wWidth - margin, top: imgHeight - wHeight - margin };
    }
};
/**
 * Applies studio's or event's watermark to a photo using Sharp.
 * Uses a fixed reference width (REFERENCE_WIDTH) so that the watermark
 * appears the same absolute size on every image, regardless of the
 * actual image dimensions.
 */
var REFERENCE_WIDTH = 1600; // All percentage calculations use this base
var applyWatermark = function (imageBuffer, studioId, eventId) { return __awaiter(void 0, void 0, void 0, function () {
    var wmSettings, event_1, wmType, studio, type, text, logoUrl, position, opacity, widthPercentage, heightPercentage, metadata, width, height, fontSize, margin, textX, textY, textAnchor, dominantBaseline, svgText, logoBuffer, logoResizedWidth, sharpLogo, refHeight, logoResizedHeight, resizedLogoBuffer, logoMeta, logoW, logoH, svgWrapper, finalLogoBuffer, pos, err_1;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                wmSettings = null;
                if (!eventId) return [3 /*break*/, 2];
                return [4 /*yield*/, models_1.Event.findById(eventId)];
            case 1:
                event_1 = _b.sent();
                if (event_1) {
                    // If the event specifically has watermark disabled, DO NOT apply any watermark
                    if (!((_a = event_1.watermark) === null || _a === void 0 ? void 0 : _a.isActive)) {
                        return [2 /*return*/, imageBuffer];
                    }
                    wmType = event_1.watermark.type || 'LOGO';
                    if (wmType === 'LOGO' && event_1.watermark.logoUrl) {
                        wmSettings = {
                            type: 'LOGO',
                            logoUrl: event_1.watermark.logoUrl,
                            position: event_1.watermark.position,
                            opacity: event_1.watermark.opacity,
                            widthPercentage: event_1.watermark.width,
                            heightPercentage: event_1.watermark.height,
                        };
                    }
                    else if (wmType === 'TEXT' && event_1.watermark.text) {
                        wmSettings = {
                            type: 'TEXT',
                            text: event_1.watermark.text,
                            position: event_1.watermark.position,
                            opacity: event_1.watermark.opacity,
                            widthPercentage: event_1.watermark.width,
                            heightPercentage: event_1.watermark.height,
                        };
                    }
                }
                _b.label = 2;
            case 2:
                if (!!wmSettings) return [3 /*break*/, 4];
                return [4 /*yield*/, models_1.Studio.findById(studioId)];
            case 3:
                studio = _b.sent();
                if (!studio || !studio.watermark || studio.watermark.type === 'NONE') {
                    return [2 /*return*/, imageBuffer];
                }
                wmSettings = {
                    type: studio.watermark.type,
                    text: studio.watermark.text,
                    logoUrl: studio.watermark.logoUrl,
                    position: studio.watermark.position,
                    opacity: studio.watermark.opacity,
                    widthPercentage: 18, // Legacy studio default
                    heightPercentage: null,
                };
                _b.label = 4;
            case 4:
                type = wmSettings.type, text = wmSettings.text, logoUrl = wmSettings.logoUrl, position = wmSettings.position, opacity = wmSettings.opacity, widthPercentage = wmSettings.widthPercentage, heightPercentage = wmSettings.heightPercentage;
                return [4 /*yield*/, (0, sharp_1.default)(imageBuffer).metadata()];
            case 5:
                metadata = _b.sent();
                width = metadata.width || 1200;
                height = metadata.height || 800;
                if (!(type === 'TEXT' && text)) return [3 /*break*/, 6];
                fontSize = Math.round(width * 0.035);
                margin = Math.round(width * 0.02);
                textX = void 0;
                textY = void 0;
                textAnchor = void 0;
                dominantBaseline = void 0;
                switch (position) {
                    case 'TOP_LEFT':
                        textX = "".concat(margin);
                        textY = "".concat(margin + fontSize);
                        textAnchor = 'start';
                        dominantBaseline = 'auto';
                        break;
                    case 'TOP_RIGHT':
                        textX = "".concat(width - margin);
                        textY = "".concat(margin + fontSize);
                        textAnchor = 'end';
                        dominantBaseline = 'auto';
                        break;
                    case 'BOTTOM_LEFT':
                        textX = "".concat(margin);
                        textY = "".concat(height - margin);
                        textAnchor = 'start';
                        dominantBaseline = 'auto';
                        break;
                    case 'BOTTOM_RIGHT':
                        textX = "".concat(width - margin);
                        textY = "".concat(height - margin);
                        textAnchor = 'end';
                        dominantBaseline = 'auto';
                        break;
                    case 'CENTER':
                    default:
                        textX = '50%';
                        textY = '50%';
                        textAnchor = 'middle';
                        dominantBaseline = 'middle';
                        break;
                }
                svgText = "\n      <svg width=\"".concat(width, "\" height=\"").concat(height, "\">\n        <style>\n          .watermark-text {\n            fill: #ffffff;\n            font-size: ").concat(fontSize, "px;\n            font-family: Arial, sans-serif;\n            font-weight: bold;\n            opacity: ").concat(opacity, ";\n          }\n        </style>\n        <text x=\"").concat(textX, "\" y=\"").concat(textY, "\" class=\"watermark-text\" text-anchor=\"").concat(textAnchor, "\" dominant-baseline=\"").concat(dominantBaseline, "\">").concat(text, "</text>\n      </svg>\n    ");
                return [2 /*return*/, (0, sharp_1.default)(imageBuffer)
                        .composite([{ input: Buffer.from(svgText), top: 0, left: 0 }])
                        .toBuffer()];
            case 6:
                if (!(type === 'LOGO' && logoUrl)) return [3 /*break*/, 13];
                _b.label = 7;
            case 7:
                _b.trys.push([7, 12, , 13]);
                return [4 /*yield*/, downloadUrlToBuffer(logoUrl)];
            case 8:
                logoBuffer = _b.sent();
                logoResizedWidth = Math.round(width * (widthPercentage / 100));
                sharpLogo = (0, sharp_1.default)(logoBuffer);
                if (heightPercentage) {
                    refHeight = Math.round(width * 0.75);
                    logoResizedHeight = Math.round(refHeight * (heightPercentage / 100));
                    sharpLogo = sharpLogo.resize({ width: logoResizedWidth, height: logoResizedHeight, fit: 'fill' });
                }
                else {
                    sharpLogo = sharpLogo.resize({ width: logoResizedWidth });
                }
                return [4 /*yield*/, sharpLogo.png().toBuffer()];
            case 9:
                resizedLogoBuffer = _b.sent();
                return [4 /*yield*/, (0, sharp_1.default)(resizedLogoBuffer).metadata()];
            case 10:
                logoMeta = _b.sent();
                logoW = logoMeta.width || logoResizedWidth;
                logoH = logoMeta.height || 100;
                svgWrapper = "\n        <svg width=\"".concat(logoW, "\" height=\"").concat(logoH, "\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n          <image xlink:href=\"data:image/png;base64,").concat(resizedLogoBuffer.toString('base64'), "\" width=\"").concat(logoW, "\" height=\"").concat(logoH, "\" opacity=\"").concat(opacity, "\" />\n        </svg>\n      ");
                return [4 /*yield*/, (0, sharp_1.default)(Buffer.from(svgWrapper)).png().toBuffer()];
            case 11:
                finalLogoBuffer = _b.sent();
                pos = getWatermarkPosition(position, width, height, logoW, logoH);
                return [2 /*return*/, (0, sharp_1.default)(imageBuffer)
                        .composite([{ input: finalLogoBuffer, top: pos.top, left: pos.left }])
                        .toBuffer()];
            case 12:
                err_1 = _b.sent();
                console.error('Error applying logo watermark, saving unwatermarked image:', err_1);
                return [2 /*return*/, imageBuffer];
            case 13: return [2 /*return*/, imageBuffer];
        }
    });
}); };
// Refactored async process methods so they can be called directly
var processPhoto = function (mediaId, studioId) { return __awaiter(void 0, void 0, void 0, function () {
    var media, originalBuffer, metadata, width, height, galleryImage, folderForCloudinary, compressedUrl, thumbnailImage, thumbFolder, thumbnailUrl, formData, fileBlob, faces, aiResponse, aiErr_1, _i, faces_1, face, err_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, models_1.Media.findById(mediaId)];
            case 1:
                media = _a.sent();
                if (!media)
                    throw new Error('Media document not found');
                return [4 /*yield*/, models_1.Media.findByIdAndUpdate(mediaId, { processedStatus: 'PROCESSING' })];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3:
                _a.trys.push([3, 21, , 23]);
                return [4 /*yield*/, downloadUrlToBuffer(media.r2Url)];
            case 4:
                originalBuffer = _a.sent();
                return [4 /*yield*/, (0, sharp_1.default)(originalBuffer).metadata()];
            case 5:
                metadata = _a.sent();
                width = metadata.width || 0;
                height = metadata.height || 0;
                return [4 /*yield*/, (0, sharp_1.default)(originalBuffer)
                        .rotate()
                        .resize({ width: 1600, withoutEnlargement: true })
                        .jpeg({ quality: 95 })
                        .toBuffer()];
            case 6:
                galleryImage = _a.sent();
                return [4 /*yield*/, applyWatermark(galleryImage, studioId, media.eventId.toString())];
            case 7:
                galleryImage = _a.sent();
                folderForCloudinary = "events/".concat(media.eventId, "/photos/gallery");
                return [4 /*yield*/, (0, StorageService_1.uploadFile)(galleryImage, folderForCloudinary)];
            case 8:
                compressedUrl = (_a.sent()).url;
                return [4 /*yield*/, (0, sharp_1.default)(originalBuffer)
                        .rotate()
                        .resize({ width: 400 })
                        .jpeg({ quality: 75 })
                        .toBuffer()];
            case 9:
                thumbnailImage = _a.sent();
                thumbFolder = "events/".concat(media.eventId, "/photos/thumb");
                return [4 /*yield*/, (0, StorageService_1.uploadFile)(thumbnailImage, thumbFolder)];
            case 10:
                thumbnailUrl = (_a.sent()).url;
                formData = new FormData();
                fileBlob = new Blob([new Uint8Array(galleryImage)], { type: 'image/jpeg' });
                formData.append('file', fileBlob, 'image.jpg');
                faces = [];
                _a.label = 11;
            case 11:
                _a.trys.push([11, 13, , 14]);
                return [4 /*yield*/, axios_1.default.post("".concat(AI_SERVICE_URL, "/detect-faces"), formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    })];
            case 12:
                aiResponse = _a.sent();
                faces = aiResponse.data.faces || [];
                return [3 /*break*/, 14];
            case 13:
                aiErr_1 = _a.sent();
                console.warn("[AI Warning]: AI Face Service offline. Skipping face detection for photo ".concat(mediaId, ":"), aiErr_1.message);
                return [3 /*break*/, 14];
            case 14:
                console.log("Detected ".concat(faces.length, " faces in photo ").concat(mediaId));
                _i = 0, faces_1 = faces;
                _a.label = 15;
            case 15:
                if (!(_i < faces_1.length)) return [3 /*break*/, 18];
                face = faces_1[_i];
                return [4 /*yield*/, models_1.FaceEmbedding.create({
                        mediaId: media._id,
                        eventId: media.eventId,
                        studioId: media.studioId,
                        embedding: face.embedding,
                        bbox: face.bbox,
                        faceThumbnailUrl: "data:image/jpeg;base64,".concat(face.thumbnail),
                    })];
            case 16:
                _a.sent();
                _a.label = 17;
            case 17:
                _i++;
                return [3 /*break*/, 15];
            case 18: return [4 /*yield*/, models_1.Media.findByIdAndUpdate(mediaId, {
                    processedStatus: 'COMPLETED',
                    thumbnailUrl: thumbnailUrl,
                    compressedUrl: compressedUrl,
                    width: width,
                    height: height,
                })];
            case 19:
                _a.sent();
                return [4 /*yield*/, models_1.Studio.findByIdAndUpdate(studioId, { $inc: { 'usage.photosUploaded': 1 } })];
            case 20:
                _a.sent();
                return [3 /*break*/, 23];
            case 21:
                err_2 = _a.sent();
                console.error("Failed to process photo ".concat(mediaId, ":"), err_2);
                return [4 /*yield*/, models_1.Media.findByIdAndUpdate(mediaId, { processedStatus: 'FAILED' })];
            case 22:
                _a.sent();
                throw err_2;
            case 23: return [2 /*return*/];
        }
    });
}); };
exports.processPhoto = processPhoto;
var processVideo = function (mediaId, studioId) { return __awaiter(void 0, void 0, void 0, function () {
    var media, tempDir, tempVideoPath, framesDir, originalBuffer, duration_1, frameFiles, i, frameFile, framePath, timestamp, frameBuffer, formData, fileBlob, aiResponse, faces, _i, faces_2, face, aiErr_2, thumbFolder, tempThumbPath, thumbnailUrl, thumbBuffer, url, err_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, models_1.Media.findById(mediaId)];
            case 1:
                media = _a.sent();
                if (!media)
                    throw new Error('Media document not found');
                return [4 /*yield*/, models_1.Media.findByIdAndUpdate(mediaId, { processedStatus: 'PROCESSING' })];
            case 2:
                _a.sent();
                tempDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'video-proc-'));
                tempVideoPath = path_1.default.join(tempDir, "video_".concat(mediaId, ".mp4"));
                framesDir = path_1.default.join(tempDir, 'frames');
                fs_1.default.mkdirSync(framesDir);
                _a.label = 3;
            case 3:
                _a.trys.push([3, 22, 24, 25]);
                return [4 /*yield*/, downloadUrlToBuffer(media.r2Url)];
            case 4:
                originalBuffer = _a.sent();
                fs_1.default.writeFileSync(tempVideoPath, originalBuffer);
                return [4 /*yield*/, new Promise(function (resolve, reject) {
                        fluent_ffmpeg_1.default.ffprobe(tempVideoPath, function (err, metadata) {
                            if (err)
                                reject(err);
                            else
                                resolve(metadata.format.duration || 0);
                        });
                    })];
            case 5:
                duration_1 = _a.sent();
                return [4 /*yield*/, new Promise(function (resolve, reject) {
                        (0, fluent_ffmpeg_1.default)(tempVideoPath)
                            .outputOptions([
                            '-vf', 'fps=1/2',
                            '-vsync', 'vfr',
                        ])
                            .output(path_1.default.join(framesDir, 'frame-%03d.jpg'))
                            .on('end', function () { return resolve(); })
                            .on('error', function (err) { return reject(err); })
                            .run();
                    })];
            case 6:
                _a.sent();
                frameFiles = fs_1.default.readdirSync(framesDir).sort();
                console.log("Extracted ".concat(frameFiles.length, " frames from video ").concat(mediaId));
                i = 0;
                _a.label = 7;
            case 7:
                if (!(i < frameFiles.length)) return [3 /*break*/, 16];
                frameFile = frameFiles[i];
                framePath = path_1.default.join(framesDir, frameFile);
                timestamp = i * 2 + 1;
                frameBuffer = fs_1.default.readFileSync(framePath);
                formData = new FormData();
                fileBlob = new Blob([new Uint8Array(frameBuffer)], { type: 'image/jpeg' });
                formData.append('file', fileBlob, 'frame.jpg');
                _a.label = 8;
            case 8:
                _a.trys.push([8, 14, , 15]);
                return [4 /*yield*/, axios_1.default.post("".concat(AI_SERVICE_URL, "/detect-faces"), formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    })];
            case 9:
                aiResponse = _a.sent();
                faces = aiResponse.data.faces || [];
                _i = 0, faces_2 = faces;
                _a.label = 10;
            case 10:
                if (!(_i < faces_2.length)) return [3 /*break*/, 13];
                face = faces_2[_i];
                return [4 /*yield*/, models_1.FaceEmbedding.create({
                        mediaId: media._id,
                        eventId: media.eventId,
                        studioId: media.studioId,
                        embedding: face.embedding,
                        bbox: face.bbox,
                        faceThumbnailUrl: "data:image/jpeg;base64,".concat(face.thumbnail),
                        timestamp: timestamp,
                    })];
            case 11:
                _a.sent();
                _a.label = 12;
            case 12:
                _i++;
                return [3 /*break*/, 10];
            case 13: return [3 /*break*/, 15];
            case 14:
                aiErr_2 = _a.sent();
                console.error("Error processing frame ".concat(frameFile, " at timestamp ").concat(timestamp, ":"), aiErr_2);
                return [3 /*break*/, 15];
            case 15:
                i++;
                return [3 /*break*/, 7];
            case 16:
                thumbFolder = "events/".concat(media.eventId, "/videos/thumb");
                tempThumbPath = path_1.default.join(tempDir, 'vid_thumb.jpg');
                return [4 /*yield*/, new Promise(function (resolve, reject) {
                        (0, fluent_ffmpeg_1.default)(tempVideoPath)
                            .screenshots({
                            timestamps: [Math.min(2, duration_1 / 2)],
                            folder: tempDir,
                            filename: 'vid_thumb.jpg',
                            size: '400x?',
                        })
                            .on('end', function () { return resolve(); })
                            .on('error', function (err) { return reject(err); });
                    })];
            case 17:
                _a.sent();
                thumbnailUrl = '';
                if (!fs_1.default.existsSync(tempThumbPath)) return [3 /*break*/, 19];
                thumbBuffer = fs_1.default.readFileSync(tempThumbPath);
                return [4 /*yield*/, (0, StorageService_1.uploadFile)(thumbBuffer, thumbFolder)];
            case 18:
                url = (_a.sent()).url;
                thumbnailUrl = url;
                _a.label = 19;
            case 19: return [4 /*yield*/, models_1.Media.findByIdAndUpdate(mediaId, {
                    processedStatus: 'COMPLETED',
                    thumbnailUrl: thumbnailUrl,
                    compressedUrl: media.r2Url,
                    duration: duration_1,
                })];
            case 20:
                _a.sent();
                return [4 /*yield*/, models_1.Studio.findByIdAndUpdate(studioId, { $inc: { 'usage.videosUploaded': 1 } })];
            case 21:
                _a.sent();
                return [3 /*break*/, 25];
            case 22:
                err_3 = _a.sent();
                console.error("Failed to process video ".concat(mediaId, ":"), err_3);
                return [4 /*yield*/, models_1.Media.findByIdAndUpdate(mediaId, { processedStatus: 'FAILED' })];
            case 23:
                _a.sent();
                throw err_3;
            case 24:
                try {
                    fs_1.default.rmSync(tempDir, { recursive: true, force: true });
                }
                catch (cleanupErr) {
                    console.error('Error cleaning up temp directory:', cleanupErr);
                }
                return [7 /*endfinally*/];
            case 25: return [2 /*return*/];
        }
    });
}); };
exports.processVideo = processVideo;
var processMediaLocal = function (mediaId, type, studioId) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(type === 'PHOTO')) return [3 /*break*/, 2];
                return [4 /*yield*/, (0, exports.processPhoto)(mediaId, studioId)];
            case 1:
                _a.sent();
                return [3 /*break*/, 4];
            case 2: return [4 /*yield*/, (0, exports.processVideo)(mediaId, studioId)];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.processMediaLocal = processMediaLocal;
// Initialize BullMQ workers only when Redis is available
function initWorkers() {
    var _this = this;
    var photoWorker = new bullmq_1.Worker('photo-processing', function (job) { return __awaiter(_this, void 0, void 0, function () {
        var _a, mediaId, studioId;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = job.data, mediaId = _a.mediaId, studioId = _a.studioId;
                    return [4 /*yield*/, (0, exports.processPhoto)(mediaId, studioId)];
                case 1:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    }); }, { connection: redis_1.redisConfig });
    var videoWorker = new bullmq_1.Worker('video-processing', function (job) { return __awaiter(_this, void 0, void 0, function () {
        var _a, mediaId, studioId;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = job.data, mediaId = _a.mediaId, studioId = _a.studioId;
                    return [4 /*yield*/, (0, exports.processVideo)(mediaId, studioId)];
                case 1:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    }); }, { connection: redis_1.redisConfig });
    exports.photoQueue.on('error', function (err) { return console.warn('BullMQ photoQueue warning:', err.message); });
    exports.videoQueue.on('error', function (err) { return console.warn('BullMQ videoQueue warning:', err.message); });
    photoWorker.on('error', function (err) { return console.warn('BullMQ photoWorker warning:', err.message); });
    videoWorker.on('error', function (err) { return console.warn('BullMQ videoWorker warning:', err.message); });
}
