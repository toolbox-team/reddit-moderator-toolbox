import {type ComponentPropsWithoutRef} from 'react';
import {classes} from '../../util/ui_interop';
import css from './BracketButton.module.css';

export const BracketButton = ({
    inline,
    className,
    ...props
}: ComponentPropsWithoutRef<'button'> & {
    inline?: boolean;
}) => (
    <button
        className={classes(css.bracketButton, className)}
        {...props}
    />
);
