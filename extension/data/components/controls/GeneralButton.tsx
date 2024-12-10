import {type ComponentPropsWithRef} from 'react';
import {classes} from '../../util/ui_interop';
import css from './GeneralButton.module.css';

export const GeneralButton = ({
    inline,
    className,
    ...props
}: ComponentPropsWithRef<'button'> & {
    inline?: boolean;
}) => (
    <button
        className={classes(css.generalButton, className)}
        {...props}
    />
);
