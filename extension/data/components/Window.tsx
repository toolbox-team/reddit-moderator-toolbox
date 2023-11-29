import {ReactNode, useEffect, useRef} from 'react';
import {Icon} from './Icon';

export const Window = ({
    title,
    footer,
    className = '',
    draggable = false,
    closable = true,
    children,
    onClose,
}: {
    title: ReactNode;
    footer?: ReactNode;
    className?: string;
    draggable?: boolean;
    closable?: boolean;
    children?: ReactNode;
    onClose: () => void;
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

    return (
        <div ref={windowRef} className={`tb-window ${draggable ? 'tb-window-draggable' : ''} ${className}`}>
            <div ref={windowHeaderRef} className='tb-window-header'>
                <div className='tb-window-title'>{title}</div>
                <div className='buttons'>
                    {/* TODO: support arbitrary extra buttons (e.g. help) */}
                    {closable && (
                        <a className='close' href='javascript:;' onClick={() => onClose()}>
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
