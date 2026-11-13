export const STORY_STORAGE_KEY = 'bimu:story:v1';

function normalize(progress) {
    const stage = Number.isInteger(progress?.stage) ? Math.min(9, Math.max(0, progress.stage)) : 0;
    const completed = progress?.completed === true;
    const seenScenes = Array.isArray(progress?.seenScenes)
        ? [...new Set(progress.seenScenes.filter(id => typeof id === 'string' && id.length > 0 && id.length <= 80))].slice(0, 32)
        : [];
    return {
        version: 1,
        stage: completed ? 9 : stage,
        seenScenes,
        melodyComplete: completed || stage === 9 && progress?.melodyComplete === true,
        completed
    };
}

export function loadStoryProgress(storage) {
    try {
        const saved = JSON.parse((storage || globalThis.localStorage).getItem(STORY_STORAGE_KEY));
        if (!saved || typeof saved !== 'object' || saved.version !== 1 ||
            !Number.isInteger(saved.stage) || saved.stage < 0 || saved.stage > 9) return null;
        return normalize(saved);
    } catch {
        return null;
    }
}

// Return the usable in-memory save even when the browser blocks persistence.
export function saveStoryProgress(progress, storage) {
    const saved = normalize(progress);
    try {
        (storage || globalThis.localStorage).setItem(STORY_STORAGE_KEY, JSON.stringify(saved));
    } catch {
        // Playing the campaign does not require local storage access.
    }
    return saved;
}

export function clearStoryProgress(storage) {
    try {
        (storage || globalThis.localStorage).removeItem(STORY_STORAGE_KEY);
        return true;
    } catch {
        return false;
    }
}
