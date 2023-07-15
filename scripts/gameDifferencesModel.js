export const ERROR_CODES = {
    LEVEL_NOT_LOADED: 0,
    LEVEL_IMAGE_NOT_LOADED: 1,
};

function getLevelData(level, url, onError) {
    return fetch(url.replace('[level]', level)).then(response => {
        if (response.ok) {
            return response.json().then(data => {
                return data;
            }).catch(error => {
                onError(ERROR_CODES.LEVEL_NOT_LOADED);
                return false;
            });
        } else {
            onError(ERROR_CODES.LEVEL_NOT_LOADED);
            return false;
        }
    });
}

function loadImage(imageUrl, loaded, onError) {
    const img = new Image;
    img.onload = function () {
        loaded();
    }
    img.onError = function () {
        onError(ERRORS.LEVEL_IMAGE_NOT_LOADED);
    }

    img.src = imageUrl;
}

function loadImages(imagesUrls, allLoaded, onError) {
    let loadedCount = 0;
    const imageLoaded = () => {
        loadedCount++;
        if (loadedCount === imagesUrls.length) allLoaded(imagesUrls);
    }
    imagesUrls.forEach(url => loadImage(url, imageLoaded, onError));
}

function tapF(onSuccess, onFail, isBlocked) {
    return (x, y, levelData) => {
        if (isBlocked()) return;

        const slot = levelData.slots.find(slot => {
            return slot.layer!=='standart' && x > slot.x && x < slot.x + slot.width && y > slot.y && y < slot.y + slot.height;
        });

        console.log(slot);

        if (slot) {
            onSuccess(slot.name, slot.x, slot.y, slot.width, slot.height);
        } else onFail(x, y);
    };
}

function loadLevelF(levelsUrl, imagesUrl, subscribes) {

    let blocked = false;
    let currentLevel;
    let slotsCount;
    let slotsTapHash = {};
    let currentLevelData;

    let score = [0, 0, 0];
    const cloneScore = () => score.map(v => v);

    function goToNextLevelF(cl)  {
        return () => loadLevel(cl + 1);
    }

    const onFail = (...args) => {
        score[1]++;
        subscribes.scoreChanged(cloneScore());
        subscribes.onFail(...args);
    }

    const loadLevel = level => {

        currentLevel = level;

        slotsTapHash = {};

        getLevelData(level, levelsUrl, subscribes.onError).then(levelData => {

            currentLevelData = levelData;

            slotsCount = levelData.slots.length - 1;
            score[2] = slotsCount;

            const onSuccess = (name,x,y,w,h) => {
                if (slotsTapHash[name]) return;
                slotsTapHash[name] = true;
                score[0]++;
                subscribes.scoreChanged(cloneScore());
                subscribes.onSuccess(x,y,w,h);
                if (score[0] >= slotsCount) {
                    blocked = true;
                    subscribes.levelCompleted(goToNextLevelF(currentLevel));
                }
            }

            const imagesUrls = levelData.slots.map(slot => imagesUrl.replace('[level]', level).replace('[imageName]', slot.name));

            loadImages(imagesUrls, () => {
                const slots = levelData.slots.map((slot, i) => {
                    slot.imageUrl = imagesUrls[i];
                    return slot;
                });
                blocked = false;
                score[0] = 0;
                score[1] = 0;
                const tap = tapF(onSuccess, onFail, () => blocked);
                subscribes.levelLoaded(level, slots, (x, y) => tap(x, y, currentLevelData));
                subscribes.scoreChanged(cloneScore());
            }, subscribes.onError);
        });
    }

    return loadLevel;
}

export default function(levelsUrl, imagesUrl, subscribes) {
    return firstLevel => loadLevelF(levelsUrl, imagesUrl, subscribes)(firstLevel);
}