// Expose the game engine to the browser console/external scripts
window.MyBaldiGame = {
    app: null,
    registerMod: function(callback) {
        window.addEventListener('DOMContentLoaded', () => {
            if (window.MyBaldiGame.app) callback(window.MyBaldiGame.app);
        });
    }
};

window.addEventListener('DOMContentLoaded', () => {
    window.MyBaldiGame.app = new GameApp();
});
