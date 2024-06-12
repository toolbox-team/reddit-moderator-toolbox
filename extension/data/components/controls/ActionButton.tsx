import {type ComponentPropsWithoutRef} from 'react';
import css from './ActionButton.module.css';

export const ActionButton = ({
    inline,
    className,
    ...props
}: ComponentPropsWithoutRef<'button'> & {
    inline?: boolean;
}) => (
    <button
        className={`${css.actionButton} ${inline ? css.inline : ''} ${className}`}
        {...props}
    />
);
