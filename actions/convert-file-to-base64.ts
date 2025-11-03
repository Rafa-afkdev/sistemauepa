// export const fileToBase64 = (file:File) =>{
//     return new Promise<string>((resolve, reject) => {
//         const reader = new FileReader()
//         reader.readAsDataURL(file)
//         reader.onload = () => resolve(reader.result as string)
//         reader.onerror = (error) => reject(error)
//     })
// }

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!file) reject(new Error("Archivo no válido"));
        
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            if (!result.includes(',')) {
                reject(new Error("Formato base64 incorrecto"));
            }
            const base64Data = result.split(',')[1];
            resolve(base64Data || '');
        };
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
};