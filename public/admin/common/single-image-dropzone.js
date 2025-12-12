Dropzone.autoDiscover = false;

/**
 * @param {string} dropzoneId - The ID of the dropzone element (e.g., "#primaryImageDropzone").
 * @param {string} uploadUrl - The URL for file uploads (e.g., "/admin/storage-unit/size/image-upload").
 * @param {string} hiddenInputId - The ID of the hidden input field to store the image URL (e.g., "#primaryImageUrl").
 * @param {string} existingImageUrl - (Optional) URL of an existing image to display on edit pages.
 * @param {string} csrfToken - (Optional) CSRF token for secure uploads.
 */
function initSingleImageDropzone(
  dropzoneId,
  uploadUrl,
  hiddenInputId,
  existingImageUrl = null,
  csrfToken = null
) {
  const hiddenInput = document.querySelector(hiddenInputId);
  if (!hiddenInput) {
    console.error(`Hidden input with ID ${hiddenInputId} not found.`);
    return;
  }

  const token =
    csrfToken || document.querySelector('meta[name="csrf-token"]')?.content;

  const myDropzone = new Dropzone(dropzoneId, {
    url: uploadUrl,
    paramName: "file",
    maxFilesize: 5, // MB
    maxFiles: 1,
    acceptedFiles: "image/*",
    addRemoveLinks: true,
    thumbnailWidth: 120,
    thumbnailHeight: 120,
    dictDefaultMessage: "Drop files here or click to upload.",
    dictFallbackMessage:
      "Your browser does not support drag'n'drop file uploads.",
    dictFileTooBig:
      "File is too big ({{filesize}}MB). Max filesize: {{maxFilesize}}MB.",
    dictInvalidFileType: "You can't upload files of this type.",
    dictResponseError: "Server responded with {{statusCode}} code.",
    dictCancelUpload: "Cancel upload",
    dictCancelUploadConfirmation:
      "Are you sure you want to cancel this upload?",
    dictRemoveFile: "Remove file",
    dictMaxFilesExceeded: "You can only upload one file.",
    headers: {
      "X-CSRF-TOKEN": token,
    },
    init: function () {
      const dropzone = this;

      if (existingImageUrl && existingImageUrl.trim() !== "") {
        const fileName = existingImageUrl.split("/").pop();
        const mockFile = {
          name: fileName,
          size: 12345,
          accepted: true,
          status: Dropzone.SUCCESS,
          upload: {
            uuid: Dropzone.uuidv4(),
            progress: 100,
            total: 12345,
            bytesSent: 12345,
            filename: fileName,
          },
        };

        // Emit the addedfile event
        dropzone.emit("addedfile", mockFile);

        // Emit the thumbnail event with the existing image URL
        dropzone.emit("thumbnail", mockFile, existingImageUrl);

        // Emit the complete event
        dropzone.emit("complete", mockFile);

        // Add the file to the files array
        dropzone.files.push(mockFile);

        hiddenInput.value = existingImageUrl;

        // Fix image aspect ratio after a short delay to ensure DOM is ready
        setTimeout(() => {
          const previewElement = dropzone.element.querySelector(".dz-preview");
          if (previewElement) {
            fixImageAspectRatio(previewElement);
          }
        }, 100);
      }

      // Remove any previously uploaded file when a new one is added
      this.on("addedfile", function (file) {
        // Only remove old files if this is a real upload (not the existing image)
        if (this.files.length > 1) {
          this.removeFile(this.files[0]);
        }
        // Don't clear the hidden input for existing images
        if (file.status !== Dropzone.SUCCESS) {
          hiddenInput.value = "";
        }
      });

      this.on("success", function (file, response) {
        if (response.url) {
          hiddenInput.value = response.url;
          fixImageAspectRatio(file.previewElement);
        } else {
          console.error("Upload success but no URL in response:", response);
          this.removeFile(file);
        }
      });

      this.on("removedfile", function (file) {
        hiddenInput.value = "";
        if (file.status === Dropzone.UPLOADING) {
          file.cancelUpload();
        }
      });

      this.on("error", function (file, message, xhr) {
        console.error("Dropzone error:", message);
        hiddenInput.value = "";
      });
    },
  });

  /**
   * @param {Element} previewElement - The preview element containing the image
   */
  function fixImageAspectRatio(previewElement) {
    const imgElement = previewElement.querySelector(".dz-image img");
    if (imgElement) {
      imgElement.style.width = "auto";
      imgElement.style.height = "auto";
      imgElement.style.maxWidth = "100%";
      imgElement.style.maxHeight = "100%";
      imgElement.style.position = "absolute";
      imgElement.style.top = "50%";
      imgElement.style.left = "50%";
      imgElement.style.transform = "translate(-50%, -50%)";
      imgElement.style.objectFit = "contain";
    }
  }

  function addStyling() {
    if (!document.getElementById("dropzone-single-custom-styles")) {
      const style = document.createElement("style");
      style.id = "dropzone-single-custom-styles";
      style.textContent = `
              /* Primary indicator positioning */
                .dz-preview {
                    position: relative;
                }
                
                .dz-preview.primary-media:after {
                    content: 'Primary';
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    background: #009ef7;
                    color: white;
                    padding: 2px 5px;
                    border-radius: 3px;
                    font-size: 10px;
                    z-index: 10;
                }
                
                /* Fix for image ratio */
                .dz-image {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 120px;
                    height: 120px;
                    overflow: hidden;
                    position: relative;
                }
                
                .dz-image img {
                    object-fit: cover;
                }
                
                /* Ensure the preview container has proper dimensions */
                .dropzone .dz-preview .dz-image {
                    width: 120px;
                    height: 120px;
                    border-radius: 8px;
                    overflow: hidden;
                }
            `;
      document.head.appendChild(style);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addStyling);
  } else {
    addStyling();
  }

  return myDropzone;
}
