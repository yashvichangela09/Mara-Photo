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
var mongoose_1 = __importDefault(require("mongoose"));
var dotenv_1 = __importDefault(require("dotenv"));
var models_1 = require("../models");
var mediaWorker_1 = require("../workers/mediaWorker");
var path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
var run = function () { return __awaiter(void 0, void 0, void 0, function () {
    var photos, count, _i, photos_1, photo, err_1, err_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 10, , 11]);
                console.log('Connecting to MongoDB...');
                return [4 /*yield*/, mongoose_1.default.connect(process.env.MONGO_URI)];
            case 1:
                _a.sent();
                console.log('Connected.');
                console.log('Deleting all existing face embeddings (they were tiny 400px versions)...');
                return [4 /*yield*/, models_1.FaceEmbedding.deleteMany({})];
            case 2:
                _a.sent();
                console.log('Cleared old embeddings.');
                return [4 /*yield*/, models_1.Media.find({ type: 'PHOTO' })];
            case 3:
                photos = _a.sent();
                console.log("Found ".concat(photos.length, " photos. Starting re-processing using high-res engine..."));
                count = 0;
                _i = 0, photos_1 = photos;
                _a.label = 4;
            case 4:
                if (!(_i < photos_1.length)) return [3 /*break*/, 9];
                photo = photos_1[_i];
                _a.label = 5;
            case 5:
                _a.trys.push([5, 7, , 8]);
                console.log("Processing photo ".concat(count + 1, "/").concat(photos.length, ": ").concat(photo._id));
                return [4 /*yield*/, (0, mediaWorker_1.processPhoto)(photo._id.toString(), photo.studioId.toString())];
            case 6:
                _a.sent();
                count++;
                return [3 /*break*/, 8];
            case 7:
                err_1 = _a.sent();
                console.error("Failed to process ".concat(photo._id), err_1);
                return [3 /*break*/, 8];
            case 8:
                _i++;
                return [3 /*break*/, 4];
            case 9:
                console.log("Finished reprocessing ".concat(count, "/").concat(photos.length, " photos."));
                process.exit(0);
                return [3 /*break*/, 11];
            case 10:
                err_2 = _a.sent();
                console.error('Migration failed:', err_2);
                process.exit(1);
                return [3 /*break*/, 11];
            case 11: return [2 /*return*/];
        }
    });
}); };
run();
