export function getElementSizeratio(element) {
    return element.clientWidth / element.clientHeight
}
export function getOrientationByratio(ratio) {
    return ratio < 1;
}

export function setElementSizeByParentElementWithRatio(parent, element, ratio) {

    let w, h;

    let parentRatio = getElementSizeratio(parent);

    let orientation = getOrientationByratio(parentRatio);

    if (orientation) {
        if (parentRatio < ratio) {
            w = parent.clientWidth;
            h = w / ratio;
        } else {
            h = parent.clientHeight;
            w = h * ratio;
        }
    } else {
        if (parentRatio > 1 / ratio) {
            h = parent.clientHeight;
            w = h / ratio;
        } else {
            w = parent.clientWidth;
            h = w * ratio;
        }
    }

    element.style.width = w + 'px';
    element.style.height = h + 'px';

    return orientation;

}

export function MainContainer(parent, element, ratio) {
    const resize = () => {
        const orientation = setElementSizeByParentElementWithRatio(parent, element, ratio);
        resizeListener(parent, element, ratio, orientation);
    }

    let resizeListener = () => { };

    const onResize = (listener) => {
        resizeListener = listener;
    }

    window.addEventListener('resize', resize);
    window.addEventListener('DOMContentLoaded', resize);
    return {
        resize, onResize
    };
}