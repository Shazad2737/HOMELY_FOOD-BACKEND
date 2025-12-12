document.addEventListener("DOMContentLoaded", function () {
  const existingImageUrl =
    document.querySelector("#foodItemImageUrl")?.value || "";
  if (typeof Dropzone === "undefined") {
    console.error("Dropzone not loaded.");
    return;
  }

  initSingleImageDropzone(
    "#foodItemImageDropzone",
    "/admin/fooditem/image-upload",
    "#foodItemImageUrl",
    existingImageUrl
  );
});
