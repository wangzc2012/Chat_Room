import * as React from 'react';
import { SVGProps } from 'react';
interface ImageProps extends SVGProps<SVGSVGElement>  {
    onUpload: (src: FileList) => void;
  }
const ImageUploadIcon = (props: ImageProps) => {
    const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        props?.onUpload(e.target.files!);
      };
    
    return(
    <label className='cursor-pointer'>
        <input
        placeholder="Image"
        value=""
        onChange={handleUploadFile}
        className='hidden'
        type="file"
      />
        <svg
            className="icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="2596"
            width={20}
            height={20}
        >
           <path d="M928 896H96c-53.02 0-96-42.98-96-96V224c0-53.02 42.98-96 96-96h832c53.02 0 96 42.98 96 96v576c0 53.02-42.98 96-96 96zM224 240c-61.856 0-112 50.144-112 112s50.144 112 112 112 112-50.144 112-112-50.144-112-112-112zM128 768h768V544l-175.03-175.03c-9.372-9.372-24.568-9.372-33.942 0L416 640l-111.03-111.03c-9.372-9.372-24.568-9.372-33.942 0L128 672v96z" p-id="2629" fill="#ffffff"></path>
        </svg>
    </label>
    )
}

export default ImageUploadIcon;
