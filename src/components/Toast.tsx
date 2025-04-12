

export function MyErrorToast(props: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className=" toast toast-top toast-center z-50 min-w-[200px] w-fit  max-w-[95vw]">
            <div className="alert alert-error font-mono  btn-primary font-bold font-mono shadow-xl flex justify-center">
                <div className=" text-center ">
                    <span>{props.children}</span>
                </div>
            </div>
        </div>
    );
}

export function MyInfoToast(props: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className=" toast toast-top toast-center z-50  min-w-[200px] w-fit  max-w-[95vw]">
            <div className="alert alert-info font-mono  btn-primary font-bold font-mono shadow-xl flex justify-center">
                <div className=" text-center ">
                    <span>{props.children}</span>
                </div>
            </div>
        </div>
    );
}