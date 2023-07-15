import GameDifferencesModel from './gameDifferencesModel.js';
import HTMLView from './view/html/htmlView.js';
import App from './app.js';

const FIRST_LEVEL = 1;
const LEVELS_URL = '/mockData/level-[level].json';
const IMAGES_URL = 'https://hgstudio.ru/jstesttask/levels/[level]/images/[imageName].jpg';

const start = App(HTMLView, GameDifferencesModel, FIRST_LEVEL, LEVELS_URL, IMAGES_URL);

start();