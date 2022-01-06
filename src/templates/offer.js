import React from "react";
import InfiniteGrid from "../components/InfiniteGrid";
import Metadata from "../components/Metadata";
import { useStoreActions, useStoreState } from "easy-peasy";
import { FloatingButton } from "../components/Button";
import {
  ShareModal,
  WalletSelection,
  RequestSelection,
  TradeModal,
  SuccessTransactionToast,
  PendingTransactionToast,
  FailedTransactionToast,
  tradeErrorHandler,
} from "../components/Modal";
import { Box, SimpleGrid } from "@chakra-ui/layout";
import {
  Link,
  Tooltip,
  Button,
  ButtonGroup,
  Radio,
  RadioGroup,
  Stack,
  HStack,
  Input,
  IconButton,
  Select,
  Spinner,
  useToast,
} from "@chakra-ui/react";
import { BeatLoader } from "react-spinners";
import Icon from "@mdi/react";
import { mdiOpenInNew } from "@mdi/js";
import secrets from "../../secrets";
//import { Spinner } from "@chakra-ui/spinner";
import { createField, createForm } from "mobx-easy-form";
import { Observer, observer } from "mobx-react";
import { useMemo } from "react";
import * as yup from "yup";

import Market from "../cardano/market";
import { fromAscii, assetsToValue, assetsToDatum } from "../cardano/market/utils";
import { Address } from "../cardano/market/custom_modules/@emurgo/cardano-serialization-lib-browser/cardano_serialization_lib";

function fromHex(hex) {
  var str = "";
  for (var i = 0; i < hex.length && hex.substr(i, 2) !== "00"; i += 2)
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str;
}

const Profile = ({ pageContext: { g } }) => {
  const toast = useToast();
  // const [address, setAddress] = React.useState("");
  const [tradeType, setTradeType] = React.useState('1');
  const market = React.useRef();
  let [addressIn, setAddressIn] = React.useState('');
  React.useEffect(() => {
    loadMarket();
  }, []);
  const connected = useStoreState((state) => state.connection.connected);
  const firstUpdate = React.useRef(true);
  React.useEffect(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false;
      return;
    }
  }, [connected]);
  const [isLoading, setIsLoading] = React.useState(true);
  const offerList = useStoreState((state) => state.offers.offerList)
  const requestList = useStoreState((state) => state.requests.requestList)
  const addRequest = useStoreActions(
    (actions) => actions.requests.addRequest
  );

  const didMount = React.useRef(false);
  const isFirstConnect = React.useRef(true);

  const loadMarket = async () => {
    market.current = new Market(
      {
        base: "https://cardano-testnet.blockfrost.io/api/v0",
        projectId: secrets.PROJECT_ID
      }
    );
    await market.current.load();
  }

  const useInputs = async () => {
    if (tradeType == 1) {
      try {
        market.current.offer(assetsToValue(offerList), assetsToValue(requestList), "");
      } catch (e) {}
    }
    if (tradeType == 2) {
      try {
        market.current.purchase(addressIn, assetsToValue(requestList), assetsToValue(offerList));
      } catch (e) {}
    }
  }

  const cancelOffer = async () => {
    try {
      market.current.cancelOffer(addressIn, assetsToValue(offerList), assetsToValue(requestList))
    } catch (e) {}
  }

  function PurchaseOrOffer() {
    return (
      <RadioGroup onChange={setTradeType} value={tradeType}>
        <Stack direction='row'>
          <Radio value='1'>Offer</Radio>
          <Radio value='2'>Purchase</Radio>
        </Stack>
      </RadioGroup>
    )
  }

  const AddressInput = () => {
    [addressIn, setAddressIn] = React.useState("");
    const handleChange = event => setAddressIn(event.target.value);
  
    return (
      <>
        <Input
          value={addressIn}
          onChange={handleChange}
          placeholder="Address of TradeOwner (If purchasing) or Private Recipient (coming soon - if putting up an offer)."
        />
      </>
    );
  };

  return (
    <>
      <Metadata
        titleTwitter="NFT HAWKER: A one stop shop for your Escrow needs."
        title="NFT HAWKR | OFFER"
        description="Make a public or private offer."
      />
      <div
        style={{
          minHeight: "100vh",
          margin: "0 20px",
          marginTop: 20,
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
          marginTop: 150,
        }}
      >
          <WalletSelection/>
          <RequestSelection/>
          <PurchaseOrOffer/>
          <AddressInput/>
          <Button
            onClick={useInputs}
          >
            Offer/Purchase
          </Button>
          <Button
            onClick={cancelOffer}
          >
            Cancel Offer
          </Button>
          {/* <Spacer y={3} /> */}
          {/*<Box h={10} />*/}
        </div>
      <FloatingButton onClick={() => window.scrollTo(0, 0)} />
    </>
  );
};

export default Profile;