export default function(View, Model, firstLevel, levelsUrl, imaghesUrl) {

    const subscribes = View();

    const _startGame = Model(levelsUrl, imaghesUrl, subscribes);

    function startGame() {
        const int = setInterval(() => {
            let res = document.fonts.check("22px FilmotypeMajor");
            if (res) {
                _startGame(firstLevel);
                clearInterval(int);
            }
        }, 5e2);
    }

    return startGame;
}
