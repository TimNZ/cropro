import { IRect } from '../CropLayer';

/**
 * Renders the cropped image.
 */
export class Renderer {
  /**
   * Whether the image should be rendered at the original (natural) target image size.
   */
  public naturalSize = false;
  /**
   * Rendered image type (`image/png`, `image/jpeg`, etc.).
   */
  public imageType = 'image/png';
  /**
   * For formats that support it, specifies rendering quality.
   *
   * In the case of `image/jpeg` you can specify a value between 0 and 1 (lowest to highest quality).
   *
   * @type {number} - image rendering quality (0..1)
   */
  public imageQuality?: number;

  /**
   * When set and {@linkcode naturalSize} is `false` sets the width of the rendered image.
   *
   * Both `width` and `height` have to be set for this to take effect.
   */
  public width?: number;
  /**
   * When set and {@linkcode naturalSize} is `false` sets the height of the rendered image.
   *
   * Both `width` and `height` have to be set for this to take effect.
   */
  public height?: number;

  /**
   * Initiates rendering of the result image and returns a promise which when resolved
   * contains a data URL for the rendered image.
   *
   * @param cropImage - crop image
   */
  public rasterize(
    cropImage: SVGSVGElement,
    original: HTMLImageElement,
    cropRectangle: IRect,
    margin: number,
    rotationAngle: number,
    scaleFactorX: number,
    scaleFactorY: number
  ): Promise<string> {
    return new Promise<string>((resolve) => {
      const canvas = document.createElement('canvas');

      canvas.width = cropImage.width.baseVal.value - margin * 2;
      canvas.height = cropImage.height.baseVal.value - margin * 2;

      let xScale = 1;
      let yScale = 1;

      if (this.naturalSize === true) {
        // scale to full image size
        xScale =
          original.naturalWidth / (cropImage.width.baseVal.value - margin * 2);
        yScale =
          original.naturalHeight /
          (cropImage.height.baseVal.value - margin * 2);
        canvas.width =
          original.naturalWidth;
        canvas.height =
          original.naturalHeight;
      } else if (this.width !== undefined && this.height !== undefined) {
        // scale to specific dimensions
        xScale = this.width / cropRectangle.width;
        yScale = this.height / cropRectangle.height;
        canvas.width *= xScale;
        canvas.height *= yScale;
      }

      const ctx = canvas.getContext('2d');

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rotationAngle * Math.PI / 180);
      ctx.scale(scaleFactorX, scaleFactorY);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
      
      ctx.drawImage(original, 0, 0, canvas.width, canvas.height);

      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = cropRectangle.width * xScale;
      cropCanvas.height = cropRectangle.height * yScale;
      const tmpCtx = cropCanvas.getContext('2d');
      tmpCtx.putImageData(
        ctx.getImageData(
          (cropRectangle.x - margin) * xScale,
          (cropRectangle.y - margin) * yScale,
          cropRectangle.width * xScale,
          cropRectangle.height * yScale
        ),
        0,
        0
      );

      const result = cropCanvas.toDataURL(
        this.imageType,
        this.imageQuality
      );
      resolve(result);
    });
  }
}
