import {type ComponentPropsWithRef} from 'react';
import {classes} from '../../util/ui_interop';
import css from './ActionButton.module.css';

export const ActionButton = ({
    inline,
    className,
    ...props
}: ComponentPropsWithRef<'button'> & {
    inline?: boolean;
}) => (
    <button
        className={classes(
            css.actionButton,
            inline && css.inline,
            className,
        )}
        {...props}
    />
);
