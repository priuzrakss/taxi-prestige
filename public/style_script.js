function updateScale() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const baseWidth = 1920;
    const baseHeight = 1080;
    
    const scaleX = windowWidth / baseWidth;
    const scaleY = windowHeight / baseHeight;
    const scale = Math.min(scaleX, scaleY);
    
    document.documentElement.style.fontSize = `${scale * 16}px`;
}

window.addEventListener('resize', updateScale);
window.addEventListener('load', updateScale);