import {type ComponentPropsWithRef} from 'react';
import {classes} from '../../util/ui_interop';
import css from './BracketButton.module.css';

export const BracketButton = ({
    inline,
    className,
    ...props
}: ComponentPropsWithRef<'button'> & {
    inline?: boolean;
}) => (
    <button
        className={classes(css.bracketButton, className)}
        {...props}
    />
);
