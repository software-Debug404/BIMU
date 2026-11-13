// Resolve os recursos em relação ao módulo, inclusive quando o jogo está em uma subpasta.
export async function loadImages(paths, onProgress = () => {}) {
    const images = {};
    let loaded = 0;
    onProgress(loaded, paths.length);

    await Promise.all(paths.map(path => new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            images[path] = image;
            onProgress(++loaded, paths.length);
            resolve();
        };
        image.onerror = () => reject(new Error(`Não foi possível carregar: ${path}`));
        image.src = new URL(path, import.meta.url).href;
    })));

    return images;
}
