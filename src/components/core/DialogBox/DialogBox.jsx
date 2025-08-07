import { Dialog } from "primereact/dialog";
import { classNames } from "primereact/utils";
import "./DialogBox.css";
import ButtonWrapper from "../Button/Button";

const DialogBox = ({
    details,
    message,
    className,
    content,
    draggable,
    header,
    footer,
    position,
    resizeable,
    style,
    visible,
    size="lg",
    showHeader=true,
    onShow,
    onHide,
    onOk,
    onCancel,
    okLabel,
    cancelLabel,
    icon,
    blockScroll=true
}) =>{


    const DefaultFooter = (
        <div className="dialog-footer">
            <ButtonWrapper size="sm" outlined onClick={onCancel}>{ cancelLabel || "Cancel"}</ButtonWrapper>
            <ButtonWrapper size="sm" onClick={onOk}>{okLabel || "Ok"}</ButtonWrapper>
        </div>
    )

    const footerContent = footer ? footer : (onOk || onCancel) ? DefaultFooter : null;

    return(
        <Dialog
            className={classNames(className, {
                      "medium": size === 'md',
                      "small": size === 'sm',
                      "large": size === "lg",
                      "extra-large": size === "xl"
                    })}
            content={content}
            draggable={draggable}
            header={header}
            footer={footerContent}
            position={position}
            resizable={resizeable}
            style={style}
            visible={visible}
            showHeader={showHeader}
            onShow={onShow}
            onHide={onHide}
            blockScroll={blockScroll}
            focusOnShow={false}
        >
            <div className="dialog-icon-message">
                {icon && <div className="dialog-icon">
                    <i className={icon}/>
                </div>}
                <div className="dialog-message">
                    {message}
                </div>
            </div>
            {details}
        </Dialog>
    )
}

export default DialogBox;