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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSignature = exports.deleteFile = exports.uploadFile = void 0;
var cloudinary_1 = require("cloudinary");
var dotenv_1 = __importDefault(require("dotenv"));
var stream_1 = require("stream");
dotenv_1.default.config();
// Cloudinary will automatically pick up CLOUDINARY_URL from the environment variables
cloudinary_1.v2.config({
    secure: true,
});
/**
 * Uploads a buffer directly to Cloudinary
 * Returns the secure URL and the public_id
 */
var uploadFile = function (fileBuffer_1) {
    var args_1 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args_1[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([fileBuffer_1], args_1, true), void 0, function (fileBuffer, folder) {
        if (folder === void 0) { folder = 'mara-photo'; }
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var uploadStream = cloudinary_1.v2.uploader.upload_stream({
                        folder: folder,
                        resource_type: 'auto', // Automatically detect image or video
                    }, function (error, result) {
                        if (error) {
                            console.error('Cloudinary Upload Error:', error);
                            return reject(error);
                        }
                        if (result) {
                            resolve({
                                url: result.secure_url,
                                publicId: result.public_id,
                            });
                        }
                    });
                    var readableStream = new stream_1.Readable();
                    readableStream._read = function () { }; // _read is required but you can noop it
                    readableStream.push(fileBuffer);
                    readableStream.push(null);
                    readableStream.pipe(uploadStream);
                })];
        });
    });
};
exports.uploadFile = uploadFile;
/**
 * Deletes a file from Cloudinary given its publicId
 */
var deleteFile = function (publicId) { return __awaiter(void 0, void 0, void 0, function () {
    var error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, cloudinary_1.v2.uploader.destroy(publicId)];
            case 1:
                _a.sent();
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error("Failed to delete Cloudinary file: ".concat(publicId), error_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.deleteFile = deleteFile;
/**
 * Generate Cloudinary signature for client-side uploads
 */
var generateSignature = function (folder) {
    var timestamp = Math.round((new Date).getTime() / 1000);
    var paramsToSign = {
        timestamp: timestamp,
        folder: folder
    };
    var apiSecret = cloudinary_1.v2.config().api_secret;
    if (!apiSecret)
        throw new Error('Cloudinary API secret not configured');
    var signature = cloudinary_1.v2.utils.api_sign_request(paramsToSign, apiSecret);
    return {
        timestamp: timestamp,
        signature: signature,
        cloudName: cloudinary_1.v2.config().cloud_name,
        apiKey: cloudinary_1.v2.config().api_key,
        folder: folder
    };
};
exports.generateSignature = generateSignature;
