import { MainContainer } from './resize.js';

export const RESIZE_RATIO = 9 / 16;

const attachListener = (originListenersCollector, listener) => listener2 => originListenersCollector((...args) => {
    listener(...args);
    return listener2(...args);
});
   
function buildMainContainerF(root, elementType) {
    return function () {
        root.innerHTML = '';
        const container = document.createElement(elementType);
        container.classList.add('main-container');
        const { resize, onResize } = MainContainer(root, container, RESIZE_RATIO);

        const newOnResize = attachListener(onResize, (parent, element, ratio, orientation) => {
            if (orientation) {
                container.classList.remove('main-container--landscape');
                container.classList.add('main-container--portrait');
            } else {
                container.classList.remove('main-container--portrait');
                container.classList.add('main-container--landscape');
            }
        });

        root.appendChild(container);
        return { container, resize, onResize: newOnResize };
    }
}
/**
 * 
 * @param {string} mainContainerElementType type of root html element (canvas, div, etc...)
 * @param {function} buildStartLevel method to draw level at the start inside root element. returns updateLevelMethod
 * @returns objects with callbacks for game model:
 *      levelLoaded,
        levelCompleted,
        scoreChanged,
        onSuccess,
        onFail,
        onError
 */
export function View(
    mainContainerElementType,
    buildStartLevel
) {

    const buildMainContainer = buildMainContainerF(document.body, mainContainerElementType);

    let rootElement, resize, onResize;

    let levelHandle;

    let updLevel = (level, slots, tap) => {
        const { container: _c, resize: _r, onResize: _or } = buildMainContainer();
        rootElement = _c;
        resize = _r;
        onResize = _or;
        const updateLevel = buildStartLevel(rootElement, onResize, tap);
        levelHandle = updateLevel(level, slots);
        resize();
        updLevel = updateLevel;
        return levelHandle;
    }

    const levelLoaded = (level, slots, tap) => {
        levelHandle = updLevel(level, slots, tap);
    }


    const levelCompleted = goToNextLevel => levelHandle.startCompleteAnimation(goToNextLevel);

    const scoreChanged = score => levelHandle.drawScore(score);

    const onSuccess = (x, y,w,h) => levelHandle.drawSuccessBox(x, y,w,h);

    const onFail = (x, y) => levelHandle.drawFailBox(x, y);

    const onError = error => {
        levelHandle.drawError(error);
        console.error(error);
    }
    
    return {
        levelLoaded,
        levelCompleted,
        scoreChanged,
        onSuccess,
        onFail,
        onError
    }
}
