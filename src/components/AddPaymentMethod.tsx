import { PaperSDKError, PaperSDKErrorCode } from "../interfaces/PaperSDKError";
import React, { useEffect } from "react";
import { usePaperSDKContext } from "../Provider";

interface AddPaymentMethodProps {
  onSuccess: () => void;
  onError?: (error: PaperSDKError) => void;
}

export const AddPaymentMethod: React.FC<AddPaymentMethodProps> = ({
  onSuccess,
  onError,
}) => {
  const { chainName } = usePaperSDKContext();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // if (event.origin !== "https://paper.xyz") return;

      const data = event.data;
      console.log("data is ", data);

      if (data.eventType === "addPaymentMethodError") {
        console.error("Error in Paper SDK AddPaymentMethod", data.error);
        if (onError) {
          onError({ code: data.errorCode as PaperSDKErrorCode });
        }
      } else if (data.eventType === "addPaymentMethodSuccess") {
        onSuccess();
      }
    };

    window.addEventListener("message", handleMessage);
  }, []);

  return (
    <>
      <iframe
        src={`https://paper.xyz/sdk/v1/add-payment-method?chainName=${chainName}`}
      ></iframe>
    </>
  );
};
