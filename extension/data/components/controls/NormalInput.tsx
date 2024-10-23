import {type ComponentPropsWithoutRef} from 'react';
import {classes} from '../../util/ui_interop';
import css from './NormalInput.module.css';

// TODO: this is a terrible name
export const NormalInput = ({
    inFooter,
    className,
    ...props
}: ComponentPropsWithoutRef<'input'> & {
    inFooter?: boolean;
}) => (
    <input
        className={classes(css.normalInput, inFooter && css.inWindowFooter, className)}
        {...props}
    />
);
