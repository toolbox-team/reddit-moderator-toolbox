import {type ComponentPropsWithoutRef, forwardRef} from 'react';
import {classes} from '../../util/ui_interop';
import css from './NormalInput.module.css';

// TODO: this is a terrible name
export const NormalInput = forwardRef<
    HTMLInputElement,
    ComponentPropsWithoutRef<'input'> & {
        inFooter?: boolean;
    }
>(({
    inFooter,
    className,
    ...props
}, ref) => (
    <input
        className={classes(
            css.normalInput,
            inFooter && css.inWindowFooter,
            className,
        )}
        {...props}
        ref={ref}
    />
));
