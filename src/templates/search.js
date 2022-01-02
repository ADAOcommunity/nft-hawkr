import React from "react";
import InfiniteGrid from "../components/InfiniteGrid";
import Metadata from "../components/Metadata";
import { useStoreState } from "easy-peasy";
import { FloatingButton } from "../components/Button";
import { Box, SimpleGrid } from "@chakra-ui/layout";
import { BeatLoader } from "react-spinners";
import Icon from "@mdi/react";
import { mdiOpenInNew } from "@mdi/js";
import secrets from "../../secrets";
import { Spinner } from "@chakra-ui/spinner";
import { createField, createForm } from "mobx-easy-form";
import { Observer, observer } from "mobx-react";
import { useMemo } from "react";
import * as yup from "yup";

import Market from "../cardano/market";

// const POLICY = "d5e6bf0500378d4f0da4e8dde6becec7621cd8cbf5cbb9b87013d4cc";
const POLICY = "862cd06c4504de6114a29e0b863751ee84ad455493d43aeeb727d896";

function fromHex(hex) {
  var str = "";
  for (var i = 0; i < hex.length && hex.substr(i, 2) !== "00"; i += 2)
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str;
}

const Profile = ({ pageContext: { g } }) => {
  const [address, setAddress] = React.useState("");
  const [tokens, setTokens] = React.useState({
    owned: [],
    locked: [],
  });
  const market = React.useRef();
  React.useEffect(() => {
    loadMarket();
  }, []);
  const firstUpdate = React.useRef(true);
  const connected = useStoreState((state) => state.connection.connected);
  React.useEffect(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false;
      return;
    }
    //loadSpaceBudData();
  }, [connected]);
  const [isLoading, setIsLoading] = React.useState(true);
  const didMount = React.useRef(false);
  const isFirstConnect = React.useRef(true);

  const loadMarket = async () => {
    market.current = new Market(
      {
        base: "https://cardano-mainnet.blockfrost.io/api/v0",
        projectId: secrets.PROJECT_ID
      }
    );
    await market.current.load();
  };

  const form = createForm({
    async onSubmit({ values }) {
      console.log(values); // here we are going to first add our values to the store and then use them to construct our tx. TODO
    },
  });

  const policyId = createField({
    id: "policyId",
    form,
    initialValue: "",
  });

  const assetName = createField({
    id: "assetName",
    form,
    initialValue: "",
  })

  const qty = createField({
    id: "qty",
    form,
    initialValue: "",
  })

  //--------------------------------

  const subForm = createForm({
    async onSubmit({ values }) {
      console.log(values); // here we are going to first add our values to the store and then use them to construct our tx. TODO
    },
  });

  /*const policyId = createField({
    id: "policyId",
    subForm,
    initialValue: "",
  });

  const assetName = createField({
    id: "assetName",
    subForm,
    initialValue: "",
  })

  const qty = createField({
    id: "qty",
    subForm,
    initialValue: "",
  })*/

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
          <Observer>
            {() => {
              return (
                <div>
                  <div>Policy ID</div>
                  <input
                    value={policyId.state.value}
                    onChange={(e) => policyId.actions.onChange(e.target.value)}
                    onFocus={() => policyId.actions.onFocus()}
                    onBlur={() => policyId.actions.onBlur()}
                  ></input>
                  <div>{policyId.computed.ifWasEverBlurredThenError}</div>
                </div>
              );
            }}
          </Observer>
          <Observer>
            {() => {
              return (
                <div>
                  <div>Asset Name</div>
                  <input
                    value={assetName.state.value}
                    onChange={(e) => assetName.actions.onChange(e.target.value)}
                    onFocus={() => assetName.actions.onFocus()}
                    onBlur={() => assetName.actions.onBlur()}
                  ></input>
                  <div>{assetName.computed.ifWasEverBlurredThenError}</div>
                </div>
              );
            }}
          </Observer>
          <Observer>
            {() => {
              return (
                <div>
                  <div>Quantity</div>
                  <input
                    value={qty.state.value}
                    onChange={(e) => qty.actions.onChange(e.target.value)}
                    onFocus={() => qty.actions.onFocus()}
                    onBlur={() => qty.actions.onBlur()}
                  ></input>
                  <div>{qty.computed.ifWasEverBlurredThenError}</div>
                </div>
              );
            }}
          </Observer>
          <Observer>
            {() => {
              return (
                <button
                  onClick={form.actions.submit}
                  disabled={form.computed.isError && form.state.submitCount > 0}
                >
                  Add Requested Token ({form.computed.isError ? "invalid" : "valid"})
                </button>
              );
            }}
          </Observer>
          <Observer>
            {() => {
              return (
                <button
                  onClick={subForm.actions.submit}
                  disabled={subForm.computed.isError && subForm.state.submitCount > 0}
                >
                  Submit Request ({subForm.computed.isError ? "invalid" : "valid"})
                </button>
              );
            }}
          </Observer>
          {/* <Spacer y={3} /> */}
          {/*<Box h={10} />*/}
        </div>
      <FloatingButton onClick={() => window.scrollTo(0, 0)} />
    </>
  );
};

export default Profile;