import {type ComponentPropsWithoutRef} from 'react';
import {classes} from '../../util/ui_interop';
import css from './ActionSelect.module.css';

export const ActionSelect = ({
    inline,
    className,
    ...props
}: ComponentPropsWithoutRef<'select'> & {
    inline?: boolean;
}) => (
    <select
        className={classes(css.actionSelect, inline && css.inline, className)}
        {...props}
    />
);
