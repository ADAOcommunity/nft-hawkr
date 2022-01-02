{-# LANGUAGE DataKinds                  #-}
{-# LANGUAGE DeriveAnyClass             #-}
{-# LANGUAGE DeriveGeneric              #-}
{-# LANGUAGE DerivingStrategies         #-}
{-# LANGUAGE FlexibleContexts           #-}
{-# LANGUAGE GeneralizedNewtypeDeriving #-}
{-# LANGUAGE LambdaCase                 #-}
{-# LANGUAGE MultiParamTypeClasses      #-}
{-# LANGUAGE NoImplicitPrelude          #-}
{-# LANGUAGE OverloadedStrings          #-}
{-# LANGUAGE RecordWildCards            #-}
{-# LANGUAGE ScopedTypeVariables        #-}
{-# LANGUAGE TemplateHaskell            #-}
{-# LANGUAGE TypeApplications           #-}
{-# LANGUAGE TypeFamilies               #-}
{-# LANGUAGE TypeOperators              #-}
{-# LANGUAGE BangPatterns               #-}

import Playground.Contract
import Wallet.Emulator.Wallet as Emulator
import Plutus.Contract
import           Data.Map             as Map
import qualified Prelude              as Haskell
--
import           Control.Monad        hiding (fmap)
import           Data.Aeson           (ToJSON, FromJSON,encode)
import           Data.List.NonEmpty   (NonEmpty (..))
import           Data.Text            (pack, Text)
import           GHC.Generics         (Generic)
import qualified PlutusTx
import           PlutusTx.Prelude     as P
import           Ledger               hiding (singleton)
import           Ledger.Credential    (Credential (..))
import           Ledger.Constraints   as Constraints
import qualified Ledger.Typed.Scripts as Scripts
import           Ledger.Value         as Value
import           Ledger.Ada           as Ada hiding (divide)
import           Prelude              ((/), Float, toInteger, floor)
import           Text.Printf          (printf)
import qualified PlutusTx.AssocMap    as AssocMap
import qualified Data.ByteString.Short as SBS
import qualified Data.ByteString.Lazy  as LBS
import           Cardano.Api hiding (Value, TxOut)
import           Cardano.Api.Shelley hiding (Value, TxOut)
import           Codec.Serialise hiding (encode)
import qualified Plutus.V1.Ledger.Api as Plutus

-- Contract
-- Total Fee: 1%

data ContractInfo = ContractInfo
    { owner1 :: !(ValidatorHash, Integer, Integer) -- ValidatorHash
    , owner2 :: !(ValidatorHash, Integer) -- PubKeyHash
    } deriving (Generic, ToJSON, FromJSON)

toFraction :: Float -> Integer
toFraction p = toInteger $ floor (1 / (p / 1000))

contractInfo = ContractInfo 
    { owner1 = ("7175e003e0749ce453fc419933297de37f4e859324dc79d1156b3699f9", 1000, 1111) -- 1% 0.9%
    , owner2 = ("711eae0514665de6ac91a0ba5387e76474ebda9cc70c7301cb7a125261", 10000) -- 0.1%
    }

-- Data and Redeemers

data TradeDetails = TradeDetails
    { tradeOwner      :: !PubKeyHash
    , requestedAmount :: !Value
    , privateRecip    :: !PubKeyHash
    } deriving (Generic, ToJSON, FromJSON)

instance Eq TradeDetails where
    {-# INLINABLE (==) #-}
    a == b = (tradeOwner a == tradeOwner b) &&
             (requestedAmount a == requestedAmount b) &&
             (privateRecip a == privateRecip b)

data TradeDatum = Offer TradeDetails 
    deriving (Generic, ToJSON, FromJSON)

instance Eq TradeDatum where
    {-# INLINABLE (==) #-}
    Offer a == Offer b = a == b

data TradeAction = Buy | Cancel
    deriving (Generic, ToJSON, FromJSON)

-- Validator

{-# INLINABLE tradeValidate #-}
tradeValidate :: ContractInfo -> TradeDatum -> TradeAction -> ScriptContext -> Bool
tradeValidate contractInfo@ContractInfo{..} tradeDatum tradeAction context = case tradeDatum of
    Offer TradeDetails{..} -> case tradeAction of
        Buy ->
            ((txInfo `txSignedBy` privateRecip) || privateRecip == tradeOwner) &&
            valuePaidTo txInfo tradeOwner == requestedAmount &&
            correctFees (valueOf requestedAmount adaSymbol adaToken) tradeOwner
        Cancel -> 
            txInfo `txSignedBy` tradeOwner
    where
        txInfo :: TxInfo
        txInfo = scriptContextTxInfo context

        signer :: PubKeyHash
        signer = case txInfoSignatories txInfo of
            [pubKeyHash] -> pubKeyHash

        (owner1PubKeyHash, owner1Fee1, owner1Fee2) = owner1
        (owner2PubKeyHash, owner2Fee1) = owner2

        correctFees :: Integer -> PubKeyHash -> Bool
        correctFees lovelaceAmount tradeRecipient =
            Ada.fromValue (valueLockedBy txInfo owner1PubKeyHash) >= Ada.lovelaceOf 4000000 &&
            Ada.fromValue (valueLockedBy txInfo owner2PubKeyHash) >= Ada.lovelaceOf 1000000

data Trade
instance Scripts.ValidatorTypes Trade where
    type instance RedeemerType Trade = TradeAction
    type instance DatumType Trade = TradeDatum

tradeInstance :: Scripts.TypedValidator Trade
tradeInstance = Scripts.mkTypedValidator @Trade
    ($$(PlutusTx.compile [|| tradeValidate ||]) `PlutusTx.applyCode` PlutusTx.liftCode contractInfo)
    $$(PlutusTx.compile [|| wrap ||])
  where
    wrap = Scripts.wrapValidator @TradeDatum @TradeAction

tradeValidatorHash :: ValidatorHash
tradeValidatorHash = Scripts.validatorHash tradeInstance

tradeValidator :: Validator
tradeValidator = Scripts.validatorScript tradeInstance

tradeAddress :: Ledger.Address
tradeAddress = scriptAddress tradeValidator

-- Types

PlutusTx.makeIsDataIndexed ''ContractInfo [('ContractInfo , 0)]
PlutusTx.makeLift ''ContractInfo

PlutusTx.makeIsDataIndexed ''TradeDetails [ ('TradeDetails, 0)]
PlutusTx.makeLift ''TradeDetails

PlutusTx.makeIsDataIndexed ''TradeDatum [ ('Offer, 0)
                                        ]
PlutusTx.makeLift ''TradeDatum

PlutusTx.makeIsDataIndexed ''TradeAction [ ('Buy,       0)
                                         , ('Cancel,    1)
                                        ]
PlutusTx.makeLift ''TradeAction

tradeScript :: Plutus.Script
tradeScript = Plutus.unValidatorScript tradeValidator

tradeSBS :: SBS.ShortByteString
tradeSBS =  SBS.toShort . LBS.toStrict $ serialise tradeScript

tradeSerialised :: PlutusScript PlutusScriptV1
tradeSerialised = PlutusScriptSerialised tradeSBS