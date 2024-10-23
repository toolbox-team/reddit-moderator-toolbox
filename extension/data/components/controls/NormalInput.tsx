import {type ComponentPropsWithoutRef, useContext} from 'react';
import {WindowPlacementContext} from '../../Contexts';
import {classes} from '../../util/ui_interop';
import css from './NormalInput.module.css';

// TODO: this is a terrible name
export const NormalInput = ({
    inline,
    className,
    ...props
}: ComponentPropsWithoutRef<'input'> & {
    inline?: boolean;
}) => {
    const windowPlacement = useContext(WindowPlacementContext);

    return (
        <input
            className={classes(
                css.normalInput,
                windowPlacement === 'footer' && css.inWindowFooter,
                windowPlacement === 'content' && css.inWindowContent,
                className,
            )}
            {...props}
        />
    );
};
