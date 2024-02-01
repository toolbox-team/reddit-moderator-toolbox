import {MouseEventHandler, ReactNode, useEffect, useRef} from 'react';
import {Icon} from './Icon';

export const Window = ({
    title,
    footer,
    className = '',
    draggable = false,
    closable = true,
    children,
    onClose,
    onClick,
}: {
    title: ReactNode;
    footer?: ReactNode;
    className?: string;
    draggable?: boolean;
    closable?: boolean;
    children?: ReactNode;
    onClose?: () => void;
    onClick?: () => void;
}) => {
    const windowRef = useRef<HTMLDivElement>(null);
    const windowHeaderRef = useRef<HTMLDivElement>(null);

    if (draggable) {
        useEffect(() => {
            if (windowRef.current != null && windowHeaderRef.current != null) {
                $(windowRef.current).drag($(windowHeaderRef.current));
            }
        }, []);
    }

    const handleClick: MouseEventHandler<HTMLDivElement> = event => {
        event?.stopPropagation();
        onClick?.();
    };

    const handleClose: MouseEventHandler<HTMLAnchorElement> = event => {
        event.stopPropagation();
        onClose?.();
    };

    return (
        <div
            ref={windowRef}
            className={`tb-window ${draggable ? 'tb-window-draggable' : ''} ${className}`}
            onClick={handleClick}
        >
            <div ref={windowHeaderRef} className='tb-window-header'>
                <div className='tb-window-title'>{title}</div>
                <div className='buttons'>
                    {/* TODO: support arbitrary extra buttons (e.g. help) */}
                    {closable && (
                        <a className='close' href='javascript:;' onClick={handleClose}>
                            <Icon icon='close' />
                        </a>
                    )}
                </div>
            </div>
            <div className='tb-window-content'>
                {children}
            </div>
            {footer && (
                <div className='tb-window-footer'>
                    {footer}
                </div>
            )}
        </div>
    );
};
