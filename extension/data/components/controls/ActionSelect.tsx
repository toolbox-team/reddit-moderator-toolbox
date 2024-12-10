import {type ComponentPropsWithRef} from 'react';
import {classes} from '../../util/ui_interop';
import css from './ActionSelect.module.css';

export const ActionSelect = ({
    inline,
    className,
    ...props
}: ComponentPropsWithRef<'select'> & {
    inline?: boolean;
}) => (
    <select
        className={classes(
            css.actionSelect,
            inline && css.inline,
            className,
        )}
        {...props}
    />
);
