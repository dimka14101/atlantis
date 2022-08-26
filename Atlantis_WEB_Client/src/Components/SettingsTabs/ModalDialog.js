import React from 'react'
import { Tabs, Tab, Button, Container } from 'react-bootstrap';
import { useTranslation, withTranslation, Trans } from 'react-i18next';
import Modal from 'react-bootstrap/Modal';

const ModalDialog = (props) => {
  const { t, i18n } = useTranslation();

  return (
    <>

      <Modal {...props} animation={false}>
        <Modal.Header closeButton>
          <Modal.Title>Modal heading</Modal.Title>
        </Modal.Header>
        <Modal.Body>{props.text}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={props.onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={props.onHide}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}



export default ModalDialog;