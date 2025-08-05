/**
 * Carrega uma lista de imagens e retorna uma Promise que resolve
 * quando todas as imagens foram carregadas.
 * @param {string[]} paths Array com os caminhos das imagens.
 * @returns {Promise<Object>} Uma promessa que resolve com um objeto
 * mapeando caminhos para objetos Image carregados.
 */
export function loadImages(paths) {
    return new Promise(resolve => {
        const images = {};
        const totalImages = paths.length;
        let loadedCount = 0;

        if (totalImages === 0) {
            resolve(images);
            return;
        }

        paths.forEach(path => {
            const img = new Image();
            img.onload = () => {
                loadedCount++;
                if (loadedCount === totalImages) {
                    resolve(images);
                }
            };
            img.onerror = () => {
                console.error(`Falha ao carregar a imagem: ${path}`);
                loadedCount++;
                if (loadedCount === totalImages) {
                    resolve(images); 
                }
            };
            img.src = path;
            images[path] = img;
        });
    });
}