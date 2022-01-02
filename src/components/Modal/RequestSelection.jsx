import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  NumberInput,
  NumberInputField,
  Box,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  useDisclosure,
  Spinner,
  useToast,
} from "@chakra-ui/react";
import {
  CheckCircleIcon,
  ExternalLinkIcon,
  InfoIcon,
  WarningIcon,
} from "@chakra-ui/icons";
import { fromAscii } from "../../cardano/market/utils";
import { UnitDisplay } from "../UnitDisplay";
import { useStoreActions, useStoreState } from "easy-peasy";

const toUnit = (amount, decimals = 6) => {
  const result = parseFloat(amount.replace(/[,\s]/g, ""))
    .toLocaleString("en-EN", { minimumFractionDigits: decimals })
    .replace(/[.,\s]/g, "");
  if (!result) return "0";
  else if (result == "NaN") return "0";
  return result;
};

const isBrowser = () => typeof window !== "undefined";

const RequestSelection = () => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const addRequest = useStoreActions(
      (actions) => actions.requests.addRequest
    );
    let [policy, setPolicy] = React.useState("");
    let [tName, setTName] = React.useState("");
    let [tNum, setTNum] = React.useState('0');
    const toast = useToast();

    const PolicyInput = () => {
      [policy, setPolicy] = React.useState("");
      const handleChange = event => setPolicy(event.target.value);
    
      return (
        <>
          <Input
            value={policy}
            onChange={handleChange}
            placeholder="Policy ID"
          />
        </>
      );
    };

    const TokenNameInput = () => {
      [tName, setTName] = React.useState("");
      const handleChange = event => setTName(event.target.value);
    
      return (
        <>
          <Input
            value={tName}
            onChange={handleChange}
            placeholder="Token Name"
          />
        </>
      );
    };

    const NumberOfAsset = () => {
      [tNum, setTNum] = React.useState('0');
      const parse = (val) => val.replace(/^\$/, '')
    
      return (
        <NumberInput
          onChange={(valueString) => setTNum(parse(valueString))}
          value={tNum}
        >
          <NumberInputField />
        </NumberInput>
      )
    }

    const addAssets = () => {
      addRequest({ // TODO - We need to make this use unit and quantity as the offer function expects so that we can shoot it over effectively. That way it converts nicely.
        // TODO - We may also want to take into consideration ADA values here without indvidiuals inputting the policy "lovelace" with no token name will give you ada.
        // 1/1M of an ADA.
        unit: policy + fromAscii(tName),
        quantity: tNum
      })
    }

    return (
      <>
        <Button onClick={onOpen}>Select Assets to Request</Button>

        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Add an asset that you will receive.</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <PolicyInput/>
              <TokenNameInput/>
              <NumberOfAsset/>
              <p>Please input the number desired above. This form is for your requested value.</p>
            </ModalBody>

            <ModalFooter>
              <Button colorScheme='blue' mr={3} onClick={onClose}>
                Close
              </Button>
              <Button variant='ghost' onClick={addAssets}>Add Asset to Offer</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    );
  }

export default RequestSelection;
