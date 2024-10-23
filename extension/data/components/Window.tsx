import {MouseEventHandler, ReactNode, useLayoutEffect, useRef} from 'react';
import {WindowPlacementContext} from '../Contexts';
import {classes} from '../util/ui_interop';
import {Icon} from './controls/Icon';
import css from './Window.module.css';

export const Window = ({
    title,
    footer,
    className = '',
    draggable = false,
    initialPosition,
    closable = true,
    children,
    onClose,
    onClick,
}: {
    title: ReactNode;
    footer?: ReactNode;
    className?: string;
    draggable?: boolean;
    initialPosition?: {top: number; left: number};
    closable?: boolean;
    children?: ReactNode;
    onClose?: () => void;
    onClick?: () => void;
}) => {
    const windowRef = useRef<HTMLDivElement>(null);
    const windowHeaderRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (draggable && windowRef.current != null && windowHeaderRef.current != null) {
            if (initialPosition) {
                windowRef.current.style.top = `${initialPosition.top}px`;
                windowRef.current.style.left = `${initialPosition.left}px`;
            }
            $(windowRef.current).drag($(windowHeaderRef.current));
        }
    }, []);

    const handleClick: MouseEventHandler<HTMLDivElement> = event => {
        event.stopPropagation();
        onClick?.();
    };

    const handleClose: MouseEventHandler<HTMLAnchorElement> = event => {
        event.stopPropagation();
        onClose?.();
    };

    return (
        <div
            ref={windowRef}
            className={classes(
                css.window,
                draggable && css.draggable,
                className,
            )}
            onClick={handleClick}
        >
            <div ref={windowHeaderRef} className={css.header}>
                <WindowPlacementContext.Provider value='header'>
                    <div className={css.title}>{title}</div>
                    <div className={css.buttons}>
                        {/* TODO: support arbitrary extra buttons (e.g. help) */}
                        {closable && (
                            <a href='javascript:;' onClick={handleClose}>
                                <Icon icon='close' />
                            </a>
                        )}
                    </div>
                </WindowPlacementContext.Provider>
            </div>
            <div className={css.content}>
                <WindowPlacementContext.Provider value='content'>
                    {children}
                </WindowPlacementContext.Provider>
            </div>
            {footer && (
                <div className={css.footer}>
                    <WindowPlacementContext.Provider value='footer'>
                        {footer}
                    </WindowPlacementContext.Provider>
                </div>
            )}
        </div>
    );
};
