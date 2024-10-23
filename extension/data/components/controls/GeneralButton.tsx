import {type ComponentPropsWithoutRef, forwardRef} from 'react';
import {classes} from '../../util/ui_interop';
import css from './GeneralButton.module.css';

export const GeneralButton = forwardRef<HTMLButtonElement>(({
    inline,
    className,
    ...props
}: ComponentPropsWithoutRef<'button'> & {
    inline?: boolean;
}, ref) => (
    <button
        className={classes(css.generalButton, className)}
        {...props}
        ref={ref}
    />
));
