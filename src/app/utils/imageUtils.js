export const handleImageChange = async (file, setImageObject) => {
    if (file) {
        setImageObject({ file });
        const reader = new FileReader();
        reader.onload = async () => {
            const blob = await reader.result.split(',')[1];
            const type = file.type;
            setImageObject({ blob, type });
        };
        reader.readAsDataURL(file);
        console.log("Image upload:", file);
    } else {
        console.log("No file was selected");
    }
};