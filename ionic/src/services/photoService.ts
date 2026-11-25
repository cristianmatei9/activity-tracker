import {
    Camera,
    CameraResultType,
    CameraSource
} from '@capacitor/camera';
import {
    Directory,
    Filesystem
} from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export interface ActivityPhoto {
    fileName: string;
    localPath: string;
    webPath: string;
}

export async function takeActivityPhoto(): Promise<ActivityPhoto> {
    const photo = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
    });

    if (!photo.base64String) {
        throw new Error('Photo could not be captured');
    }

    const format = photo.format === 'png' ? 'png' : 'jpeg';
    const fileName = `activity_${Date.now()}.${format}`;

    const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: photo.base64String,
        directory: Directory.Data,
        recursive: true
    });

    const webPath = Capacitor.isNativePlatform()
        ? Capacitor.convertFileSrc(savedFile.uri)
        : `data:image/${format};base64,${photo.base64String}`;

    return {
        fileName,
        localPath: savedFile.uri,
        webPath
    };
}

export async function loadActivityPhoto(
    fileName: string
): Promise<string> {
    const file = await Filesystem.readFile({
        path: fileName,
        directory: Directory.Data
    });

    if (file.data instanceof Blob) {
        return URL.createObjectURL(file.data);
    }

    const format = fileName.toLowerCase().endsWith('.png')
        ? 'png'
        : 'jpeg';

    return `data:image/${format};base64,${file.data}`;
}

export async function readActivityPhoto(
    fileName: string
): Promise<Blob> {
    const file = await Filesystem.readFile({
        path: fileName,
        directory: Directory.Data
    });

    if (file.data instanceof Blob) {
        return file.data;
    }

    const base64 = file.data.includes(',')
        ? file.data.split(',')[1]
        : file.data;

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    const format = fileName.toLowerCase().endsWith('.png')
        ? 'image/png'
        : 'image/jpeg';

    return new Blob([bytes], {
        type: format
    });
}
